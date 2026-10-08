import {
	type FormEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	ApiError,
	apiClient,
	networkError,
	sessionStore,
	useSession,
} from "../../api/index.ts";
import {
	Button,
	Dialog,
	EmptyState,
	Input,
	LoadingState,
	PageHeader,
	Select,
	useI18n,
} from "../../ui/index.ts";
import { authErrorKey } from "./errors.ts";
import {
	createUsersApi,
	type Invitation,
	type Member,
	safeCopyLink,
	USER_ROLES,
	type UserRole,
} from "./users-api.ts";

const users = createUsersApi(apiClient);
type Copy = { kind: "invite" | "reset"; link: string };
type Confirmation = {
	kind: "deactivate" | "cancel";
	id: string;
	label: string;
	self: boolean;
};

/** UI hints never grant authority: every list and mutation goes through B4/B5's live manager checks. */
export function UsersView({ enabled }: { enabled: boolean }) {
	const { t } = useI18n();
	const session = useSession();
	const [members, setMembers] = useState<Member[]>([]);
	const [invitations, setInvitations] = useState<Invitation[]>([]);
	const [total, setTotal] = useState(0);
	const [offset, setOffset] = useState(0);
	const [drafts, setDrafts] = useState<Record<string, UserRole>>({});
	const [loading, setLoading] = useState(true);
	const [fresh, setFresh] = useState(false);
	const [busy, setBusy] = useState(false);
	const pending = useRef(false);
	const [denied, setDenied] = useState(false);
	const [error, setError] = useState<ApiError | null>(null);
	const [notice, setNotice] = useState(false);
	const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
	const [copy, setCopy] = useState<Copy | null>(null);
	const [copied, setCopied] = useState(false);
	const [copyFailed, setCopyFailed] = useState(false);
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<UserRole>("rep");
	const [touched, setTouched] = useState(false);
	const emailInput = useRef<HTMLInputElement>(null);
	const copyInput = useRef<HTMLInputElement>(null);
	const status = useRef<HTMLParagraphElement>(null);
	const mounted = useRef(false);
	const version = useRef(0);
	const load = useCallback(
		async (clearError = true) => {
			if (!enabled) return;
			const current = ++version.current;
			setLoading(true);
			setFresh(false);
			if (clearError) setError(null);
			try {
				const [page, invites] = await Promise.all([
					users.members(offset),
					users.invitations(),
				]);
				if (!mounted.current || current !== version.current) return;
				setMembers(page.members);
				setTotal(page.total);
				setInvitations(invites);
				setDrafts(Object.fromEntries(page.members.map((m) => [m.id, m.role])));
				setFresh(true);
				setDenied(false);
				if (!page.members.length && offset > 0)
					setOffset(Math.max(0, offset - 100));
			} catch (e) {
				if (!mounted.current || current !== version.current) return;
				const failure = e instanceof ApiError ? e : networkError();
				setError(failure);
				setMembers([]);
				setInvitations([]);
				setCopy(null);
				setDenied(failure.status === 403);
			} finally {
				if (mounted.current && current === version.current) setLoading(false);
			}
		},
		[enabled, offset],
	);
	useEffect(() => {
		mounted.current = true;
		void load();
		return () => {
			mounted.current = false;
			version.current++;
		};
	}, [load]);
	useEffect(() => {
		if (error || notice) status.current?.focus();
	}, [error, notice]);
	async function run(action: () => Promise<unknown>, self = false) {
		if (pending.current || !fresh || !enabled || denied) return;
		pending.current = true;
		setBusy(true);
		setFresh(false);
		setCopy(null);
		setCopied(false);
		setCopyFailed(false);
		setError(null);
		setNotice(false);
		let success = false;
		let scopeLost = false;
		try {
			await action();
			success = true;
			if (mounted.current) {
				setNotice(true);
				setConfirmation(null);
			}
		} catch (e) {
			if (mounted.current) {
				const failure = e instanceof ApiError ? e : networkError();
				scopeLost = failure.status === 401 || failure.status === 403;
				setError(failure);
				setConfirmation(null);
			}
		} finally {
			if (mounted.current) {
				if (scopeLost || (self && success)) await sessionStore.restore();
				else await load(false);
			}
			pending.current = false;
			if (mounted.current) setBusy(false);
		}
	}
	async function createLink(
		action: () => Promise<{ link: string }>,
		kind: Copy["kind"],
	) {
		await run(async () => {
			const result = await action();
			const safe = safeCopyLink(result.link, kind, location.origin);
			if (!safe)
				throw new ApiError({
					status: 400,
					code: "AUTH_REQUEST_REJECTED",
					safeMessage: "",
					requestId: null,
					retryable: false,
				});
			if (mounted.current) setCopy({ kind, link: safe });
		});
	}
	const emailError = !email.trim()
		? t("auth.required")
		: email.trim().length > 254 ||
				!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
			? t("auth.emailInvalid")
			: undefined;
	const disabled = busy || loading || !fresh;
	function invite(event: FormEvent) {
		event.preventDefault();
		setTouched(true);
		if (emailError) {
			emailInput.current?.focus();
			return;
		}
		void createLink(() => users.invite(email.trim(), role), "invite");
	}
	function roleOptions() {
		return USER_ROLES.map((value) => (
			<option key={value} value={value}>
				{t(`role.${value}`)}
			</option>
		));
	}
	if (!enabled || denied)
		return (
			<section data-testid="users-denied">
				<EmptyState title={t("error.forbidden")} />
			</section>
		);
	return (
		<section className="grid gap-24 min-w-0" data-testid="users-page">
			<PageHeader
				title={t("nav.users")}
				subtitle={t("users.intro")}
				actions={
					<Button
						disabled={busy || loading}
						onClick={() => {
							setCopy(null);
							setNotice(false);
							void load();
						}}
						data-testid="users-refresh"
					>
						{t("users.refresh")}
					</Button>
				}
			/>
			{error ? (
				<p
					ref={status}
					tabIndex={-1}
					role="alert"
					className="text-danger-fg m-0"
					data-testid="users-error"
				>
					{t(authErrorKey(error))} {!fresh ? t("users.reconcile") : ""}
				</p>
			) : notice ? (
				<p
					ref={status}
					tabIndex={-1}
					role="status"
					className="m-0"
					data-testid="users-notice"
				>
					{t("users.updated")}
				</p>
			) : null}
			{copy ? (
				<div
					className="grid gap-12 rounded-12 border border-solid border-border bg-surface p-16"
					data-testid="users-copy-panel"
				>
					<Input
						ref={copyInput}
						label={t(
							copy.kind === "invite" ? "users.inviteLink" : "users.resetLink",
						)}
						value={copy.link}
						dir="ltr"
						readOnly
						name="copy-link"
						autoComplete="off"
						hint={t("users.linkHint")}
					/>
					<div className="flex flex-wrap gap-8">
						<Button
							data-testid="users-copy"
							onClick={() => {
								void Promise.resolve()
									.then(() => navigator.clipboard.writeText(copy.link))
									.then(() => {
										if (mounted.current) setCopied(true);
									})
									.catch(() => {
										if (mounted.current) {
											setCopyFailed(true);
											copyInput.current?.focus();
											copyInput.current?.select();
										}
									});
							}}
						>
							{t("users.copy")}
						</Button>
						<Button
							data-testid="users-clear-link"
							onClick={() => setCopy(null)}
						>
							{t("users.clearLink")}
						</Button>
					</div>
					{copied ? (
						<p role="status" className="m-0" data-testid="users-copied">
							{t("common.copied")}
						</p>
					) : null}
					{copyFailed ? (
						<p role="status" className="m-0">
							{t("users.copyFailed")}
						</p>
					) : null}
				</div>
			) : null}
			<form
				className="grid gap-12 rounded-12 border border-solid border-border bg-surface p-16"
				onSubmit={invite}
				noValidate
				data-testid="users-invite-form"
			>
				<h2 className="m-0 text-text font-heading">{t("users.invite")}</h2>
				<div className="grid gap-12 sm:grid-cols-2">
					<Input
						ref={emailInput}
						label={t("auth.email")}
						type="email"
						name="invite-email"
						autoComplete="off"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						error={touched ? emailError : undefined}
						disabled={disabled}
						required
					/>
					<Select
						label={t("users.role")}
						name="invite-role"
						value={role}
						onChange={(e) => setRole(e.target.value as UserRole)}
						disabled={disabled}
						data-testid="users-invite-role"
					>
						{roleOptions()}
					</Select>
				</div>
				<Button
					type="submit"
					variant="primary"
					disabled={disabled}
					data-testid="users-invite-submit"
				>
					{t("users.invite")}
				</Button>
			</form>
			<section className="grid gap-12 min-w-0" aria-labelledby="members-title">
				<h2 id="members-title" className="m-0 font-heading">
					{t("users.members")}
				</h2>
				{loading ? (
					<LoadingState />
				) : members.length ? (
					<div className="max-w-full overflow-x-auto rounded-12 border border-solid border-border bg-surface">
						<table
							className="w-full min-w-[680px] border-collapse text-start"
							data-testid="users-members"
						>
							<thead>
								<tr>
									{["users.member", "users.role", "users.actions"].map(
										(key) => (
											<th
												key={key}
												className="p-12 text-start bg-surface-2 border-b border-solid border-border"
											>
												{t(
													key as
														| "users.member"
														| "users.role"
														| "users.actions",
												)}
											</th>
										),
									)}
								</tr>
							</thead>
							<tbody>
								{members.map((member) => (
									<tr key={member.id} data-testid={`user-${member.id}`}>
										<td className="p-12 border-b border-solid border-border">
											<bdi dir="auto">{member.user.name}</bdi>
											<div className="text-text-2">
												<bdi dir="ltr">{member.user.email}</bdi>
											</div>
										</td>
										<td className="p-12 border-b border-solid border-border">
											<Select
												label={t("users.role")}
												value={drafts[member.id] ?? member.role}
												onChange={(e) =>
													setDrafts({
														...drafts,
														[member.id]: e.target.value as UserRole,
													})
												}
												disabled={disabled}
												data-testid={`user-role-${member.id}`}
											>
												{roleOptions()}
											</Select>
										</td>
										<td className="p-12 border-b border-solid border-border">
											<div className="flex flex-wrap gap-8">
												<Button
													disabled={
														disabled || drafts[member.id] === member.role
													}
													data-testid={`user-save-${member.id}`}
													onClick={() => {
														void run(
															() =>
																users.role(
																	member.id,
																	drafts[member.id] ?? member.role,
																),
															member.userId === session.info?.actor,
														);
													}}
												>
													{t("users.saveRole")}
												</Button>
												<Button
													disabled={disabled}
													data-testid={`user-reset-${member.id}`}
													onClick={() => {
														void createLink(
															() => users.reset(member.id),
															"reset",
														);
													}}
												>
													{t("users.resetLink")}
												</Button>
												<Button
													variant="danger"
													disabled={disabled}
													data-testid={`user-deactivate-${member.id}`}
													onClick={() =>
														setConfirmation({
															kind: "deactivate",
															id: member.id,
															label: member.user.email,
															self: member.userId === session.info?.actor,
														})
													}
												>
													{t("users.deactivate")}
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<EmptyState title={t("users.noMembers")} />
				)}
				<div className="flex flex-wrap justify-between gap-12">
					<Button
						disabled={disabled || offset === 0}
						data-testid="users-previous"
						onClick={() => {
							setCopy(null);
							setOffset(Math.max(0, offset - 100));
						}}
					>
						{t("common.previousPage")}
					</Button>
					<Button
						disabled={disabled || offset + 100 >= total}
						data-testid="users-next"
						onClick={() => {
							setCopy(null);
							setOffset(offset + 100);
						}}
					>
						{t("common.nextPage")}
					</Button>
				</div>
			</section>
			<section className="grid gap-12" aria-labelledby="invites-title">
				<h2 id="invites-title" className="m-0 font-heading">
					{t("users.invitations")}
				</h2>
				{!loading && !invitations.length ? (
					<EmptyState title={t("users.noInvitations")} />
				) : null}
				{!loading
					? invitations.map((invitation) => (
							<article
								key={invitation.id}
								className="flex flex-wrap items-center justify-between gap-12 rounded-12 border border-solid border-border bg-surface p-16"
								data-testid={`invite-${invitation.id}`}
							>
								<div className="min-w-0">
									<bdi dir="ltr" className="[overflow-wrap:anywhere]">
										{invitation.email}
									</bdi>
									<p className="m-0 text-text-2">
										{t(`role.${invitation.role}`)} ·{" "}
										{t(
											invitation.status === "pending"
												? "users.pending"
												: "users.closed",
										)}
									</p>
								</div>
								{invitation.status === "pending" ? (
									<Button
										variant="danger"
										disabled={disabled}
										data-testid={`invite-cancel-${invitation.id}`}
										onClick={() =>
											setConfirmation({
												kind: "cancel",
												id: invitation.id,
												label: invitation.email,
												self: false,
											})
										}
									>
										{t("users.cancelInvite")}
									</Button>
								) : null}
							</article>
						))
					: null}
			</section>
			<Dialog
				open={!!confirmation}
				title={t(
					confirmation?.kind === "cancel"
						? "users.cancelInvite"
						: "users.deactivate",
				)}
				onClose={() => {
					if (!busy) setConfirmation(null);
				}}
				confirm={{
					label: t(
						confirmation?.kind === "cancel"
							? "users.cancelInvite"
							: "users.deactivate",
					),
					loading: busy,
					onConfirm: () => {
						if (confirmation)
							void run(
								() =>
									confirmation.kind === "cancel"
										? users.cancel(confirmation.id)
										: users.deactivate(confirmation.id),
								confirmation.self,
							);
					},
				}}
			>
				<p>{t("users.confirm")}</p>
				<p>
					<bdi dir="ltr">{confirmation?.label}</bdi>
				</p>
			</Dialog>
		</section>
	);
}
