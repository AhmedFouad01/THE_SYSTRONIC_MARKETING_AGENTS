import { type FormEvent, useEffect, useRef, useState } from "react";
import { createAuthClient } from "../../api/auth.ts";
import { ApiError, networkError } from "../../api/errors.ts";
import { navigate } from "../../router.ts";
import { Button, Input, useI18n, useTheme } from "../../ui/index.ts";
import { authErrorKey } from "./errors.ts";
import type { AuthLink } from "./link.ts";

const auth = createAuthClient();
/** Public link pages bypass workspace bootstrap and retain capabilities in document memory only. */
export function AuthLinkPage({ link }: { link: AuthLink }) {
	const { t, locale, toggleLocale } = useI18n();
	const { mode, toggleMode } = useTheme();
	const reset = link.kind === "reset";
	const [existing, setExisting] = useState(false);
	const [signed, setSigned] = useState(false);
	const [checking, setChecking] = useState(!reset && !!link.secret);
	const [busy, setBusy] = useState(false);
	const pending = useRef(false);
	const [done, setDone] = useState(false);
	const [error, setError] = useState<ApiError | null>(null);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [touched, setTouched] = useState(false);
	const form = useRef<HTMLFormElement>(null);
	const status = useRef<HTMLParagraphElement>(null);
	useEffect(() => {
		if (reset || !link.secret) return;
		let active = true;
		auth
			.getSession()
			.then((session) => {
				if (active) setSigned(!!session?.user);
			})
			.catch((e) => {
				if (active) setError(e instanceof ApiError ? e : networkError());
			})
			.finally(() => {
				if (active) setChecking(false);
			});
		return () => {
			active = false;
		};
	}, [reset, link]);
	useEffect(() => {
		if (error || done) status.current?.focus();
	}, [error, done]);
	const newPassword = reset || !existing;
	const nameError =
		!reset && !existing && !signed && !name.trim()
			? t("auth.required")
			: undefined;
	const emailError =
		!reset && !signed
			? !email.trim()
				? t("auth.required")
				: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
					? t("auth.emailInvalid")
					: undefined
			: undefined;
	const passwordError =
		!signed || reset
			? !password
				? t("auth.required")
				: newPassword && (password.length < 12 || password.length > 128)
					? t("auth.passwordHint")
					: undefined
			: undefined;
	const confirmError =
		newPassword && (!signed || reset) && confirm !== password
			? t("auth.passwordMismatch")
			: undefined;
	const disabled = checking || busy;
	async function submit(event: FormEvent) {
		event.preventDefault();
		if (disabled || pending.current || done || !link.secret) return;
		setTouched(true);
		if (nameError || emailError || passwordError || confirmError) {
			// Focus by field name: invalid attributes update after this event returns.
			const field = nameError
				? "name"
				: emailError
					? "email"
					: passwordError
						? "password"
						: "confirm";
			form.current
				?.querySelector<HTMLInputElement>(`input[name="${field}"]`)
				?.focus();
			return;
		}
		pending.current = true;
		setBusy(true);
		setError(null);
		const enteredPassword = password;
		setPassword("");
		setConfirm("");
		setTouched(false);
		try {
			if (reset) await auth.resetPassword(link.secret, enteredPassword);
			else {
				if (!signed) {
					if (!existing) {
						await auth.signUp(
							email.trim(),
							enteredPassword,
							name.trim(),
							link.secret,
						);
						setExisting(true); // Failed login must not repeat registration.
					}
					const result = await auth.signIn(email.trim(), enteredPassword);
					if (result.twoFactorRedirect)
						throw new ApiError({
							status: 403,
							code: "AUTH_REQUEST_REJECTED",
							safeMessage: "",
							requestId: null,
							retryable: false,
						});
					setSigned(true);
				}
				await auth.acceptInvitation(link.secret);
			}
			link.secret = null;
			setName("");
			setEmail("");
			setDone(true);
		} catch (e) {
			const failure = e instanceof ApiError ? e : networkError();
			if (failure.code === "AUTH_RESET_INVALID") link.secret = null;
			// Keep an invitation after a matching-email denial so the user can switch accounts.
			setError(failure);
		} finally {
			pending.current = false;
			setBusy(false);
		}
	}
	return (
		<main
			className="grid min-h-dvh place-items-center bg-canvas p-16 text-text"
			data-testid={`${link.kind}-page`}
		>
			<section
				className="box-border w-full max-w-[440px] min-w-0 rounded-12 border border-solid border-border bg-surface p-24 shadow-panel"
				aria-labelledby="link-title"
			>
				<div className="flex flex-wrap justify-end gap-8 mb-24">
					<Button onClick={toggleLocale} data-testid="locale-toggle">
						{locale === "ar" ? "English" : "العربية"}
					</Button>
					<Button onClick={toggleMode} data-testid="theme-toggle">
						{t(mode === "light" ? "theme.switchToDark" : "theme.switchToLight")}
					</Button>
				</div>
				<h1 id="link-title" className="m-0 text-page-title font-heading">
					{t(reset ? "auth.resetTitle" : "auth.inviteTitle")}
				</h1>
				<p className="text-text-2 mb-24">
					{t(reset ? "auth.resetIntro" : "auth.inviteIntro")}
				</p>
				{done ? (
					<p
						ref={status}
						tabIndex={-1}
						role="status"
						data-testid="link-success"
					>
						{t(reset ? "auth.resetSuccess" : "auth.inviteSuccess")}
					</p>
				) : (
					<>
						{!link.secret && !error ? (
							<p role="alert" data-testid="link-error">
								{t(
									reset
										? "auth.error.reset_invalid"
										: "auth.error.invitation_invalid",
								)}
							</p>
						) : null}
						{error ? (
							<p
								ref={status}
								tabIndex={-1}
								role="alert"
								className="text-danger-fg"
								data-testid="link-error"
							>
								{t(authErrorKey(error))}
							</p>
						) : null}
						{link.secret ? (
							<form
								ref={form}
								className="grid gap-16"
								noValidate
								onSubmit={(event) => {
									void submit(event);
								}}
							>
								{!reset && !signed ? (
									<>
										<Button
											disabled={disabled}
											onClick={() => {
												setExisting(!existing);
												setTouched(false);
												setPassword("");
												setConfirm("");
											}}
											data-testid="invite-mode"
										>
											{t(
												existing
													? "auth.createAccount"
													: "auth.existingAccount",
											)}
										</Button>
										{!existing ? (
											<Input
												name="name"
												label={t("auth.name")}
												autoComplete="name"
												value={name}
												onChange={(e) => setName(e.target.value)}
												error={touched ? nameError : undefined}
												required
												disabled={disabled}
											/>
										) : null}
										<Input
											name="email"
											type="email"
											label={t("auth.email")}
											autoComplete="username"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											error={touched ? emailError : undefined}
											required
											disabled={disabled}
										/>
									</>
								) : null}
								{!signed || reset ? (
									<>
										<Input
											name="password"
											type="password"
											label={t(
												newPassword ? "auth.newPassword" : "auth.password",
											)}
											hint={newPassword ? t("auth.passwordHint") : undefined}
											autoComplete={
												newPassword ? "new-password" : "current-password"
											}
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											error={touched ? passwordError : undefined}
											required
											disabled={disabled}
										/>
										{newPassword ? (
											<Input
												name="confirm"
												type="password"
												label={t("auth.confirmPassword")}
												autoComplete="new-password"
												value={confirm}
												onChange={(e) => setConfirm(e.target.value)}
												error={touched ? confirmError : undefined}
												required
												disabled={disabled}
											/>
										) : null}
									</>
								) : (
									<Button
										disabled={disabled}
										data-testid="invite-switch-account"
										onClick={() => {
											if (pending.current) return;
											pending.current = true;
											setBusy(true);
											setError(null);
											auth
												.signOut()
												.then(() => {
													setSigned(false);
													setExisting(true);
												})
												.catch((e) =>
													setError(e instanceof ApiError ? e : networkError()),
												)
												.finally(() => {
													pending.current = false;
													setBusy(false);
												});
										}}
									>
										{t("auth.switchAccount")}
									</Button>
								)}
								<Button
									type="submit"
									variant="primary"
									size="lg"
									loading={disabled}
									data-testid="link-submit"
								>
									{t(reset ? "auth.resetSubmit" : "auth.inviteSubmit")}
								</Button>
							</form>
						) : null}
					</>
				)}
				{reset ? (
					<p className="text-text-2" data-testid="reset-email-unavailable">
						{t("auth.resetEmailUnavailable")}
					</p>
				) : null}
				<Button
					className="mt-16"
					disabled={disabled}
					onClick={() => {
						link.secret = null;
						navigate("/");
					}}
					data-testid="link-sign-in"
				>
					{t("auth.backToSignIn")}
				</Button>
			</section>
		</main>
	);
}
