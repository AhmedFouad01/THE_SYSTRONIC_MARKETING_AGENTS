import { type FormEvent, useRef, useState } from "react";
import { sessionStore, type ApiError } from "../../api/index.ts";
import { Button, Input, useI18n, useTheme } from "../../ui/index.ts";
import { authErrorKey } from "./errors.ts";

/** B7 composition; workspace context is a non-secret header, never an identity credential. */
export function SignIn({
	error,
	checking,
}: {
	error: ApiError | null;
	checking: boolean;
}) {
	const { t, locale, toggleLocale } = useI18n();
	const { mode, toggleMode } = useTheme();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [tenantId, setTenantId] = useState("");
	const [touched, setTouched] = useState(false);
	const emailRef = useRef<HTMLInputElement>(null);
	const passwordRef = useRef<HTMLInputElement>(null);
	const workspaceRef = useRef<HTMLInputElement>(null);
	const emailError = !email.trim()
		? t("auth.required")
		: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
			? t("auth.emailInvalid")
			: undefined;
	const passwordError = !password ? t("auth.required") : undefined;
	const workspaceError = !tenantId.trim()
		? t("auth.required")
		: !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
					tenantId.trim(),
				)
			? t("auth.workspaceInvalid")
			: undefined;
	async function submit(event: FormEvent) {
		event.preventDefault();
		if (checking) return;
		setTouched(true);
		const invalid = emailError
			? emailRef
			: passwordError
				? passwordRef
				: workspaceError
					? workspaceRef
					: null;
		if (invalid) {
			invalid.current?.focus();
			return;
		}
		const pending = sessionStore.signIn(email, password, {
			tenantId: tenantId.trim(),
		});
		setPassword("");
		await pending;
	}
	return (
		<main
			className="grid min-h-dvh place-items-center bg-canvas p-16 text-text"
			data-testid="sign-in-page"
		>
			<section
				className="box-border w-full max-w-[440px] min-w-0 rounded-12 border border-solid border-border bg-surface p-24 shadow-panel"
				aria-labelledby="sign-in-title"
			>
				<div className="flex flex-wrap justify-end gap-8 mb-24">
					<Button onClick={toggleLocale} data-testid="locale-toggle">
						{locale === "ar" ? "English" : "العربية"}
					</Button>
					<Button onClick={toggleMode} data-testid="theme-toggle">
						{mode === "light"
							? t("theme.switchToDark")
							: t("theme.switchToLight")}
					</Button>
				</div>
				<h1 id="sign-in-title" className="m-0 text-page-title font-heading">
					{t("auth.title")}
				</h1>
				<p className="text-text-2 mb-24">{t("auth.intro")}</p>
				<form
					className="grid gap-16"
					onSubmit={(event) => {
						void submit(event);
					}}
					noValidate
				>
					<Input
						ref={emailRef}
						label={t("auth.email")}
						name="email"
						type="email"
						autoComplete="username"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						error={touched ? emailError : undefined}
						required
						disabled={checking}
					/>
					<Input
						ref={passwordRef}
						label={t("auth.password")}
						name="password"
						type="password"
						autoComplete="current-password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						error={touched && !checking ? passwordError : undefined}
						required
						disabled={checking}
					/>
					<Input
						ref={workspaceRef}
						label={t("auth.workspace")}
						hint={t("auth.workspaceHint")}
						name="workspace"
						dir="ltr"
						autoComplete="off"
						value={tenantId}
						onChange={(event) => setTenantId(event.target.value)}
						error={touched ? workspaceError : undefined}
						required
						disabled={checking}
						spellCheck={false}
					/>
					{error ? (
						<p
							role="alert"
							className="m-0 text-danger-fg"
							data-testid="sign-in-error"
						>
							{t(authErrorKey(error))}
						</p>
					) : null}
					<Button
						type="submit"
						variant="primary"
						size="lg"
						loading={checking}
						data-testid="sign-in-submit"
					>
						{checking ? t("auth.checking") : t("auth.submit")}
					</Button>
				</form>
			</section>
		</main>
	);
}
