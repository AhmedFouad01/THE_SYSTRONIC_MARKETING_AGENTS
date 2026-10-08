import { type FormEvent, useState } from "react";
import { type ApiError, sessionStore } from "../../api/index.ts";
import { useI18n } from "../i18n/index.ts";
import { Button, Identity, Input, Panel } from "../primitives/index.ts";
import "./connect.css";

type MsgT = ReturnType<typeof useI18n>["t"];

export function describeError(e: ApiError | null, t: MsgT): string | null {
	if (!e) return null;
	switch (e.kind) {
		case "unauthenticated":
			return t("error.unauthenticated");
		case "forbidden":
			return t("error.forbidden");
		case "network":
			return t("error.network");
		case "version_conflict":
		case "conflict":
			return t("error.conflict");
		default:
			return t("error.generic");
	}
}

/** Token/tenant/grant paste gate (D6: M0 limitation, no auth product). Credentials go to sessionStorage only after GET /v1/session succeeds. */
export function ConnectGate({ error, checking }: { error: ApiError | null; checking: boolean }) {
	const { t } = useI18n();
	const [token, setToken] = useState("");
	const [tenantId, setTenantId] = useState("");
	const [grantId, setGrantId] = useState("");
	const [touched, setTouched] = useState(false);

	const submit = (e: FormEvent) => {
		e.preventDefault();
		setTouched(true);
		if (!token.trim() || !tenantId.trim()) return;
		void sessionStore.connect({ token, tenantId, grantId });
	};

	const message = describeError(error, t);
	const missing = (v: string) => (touched && !v.trim() ? t("connect.required") : undefined);

	return (
		<Panel className="sy-connect">
			<h1 className="sy-connect__title">{t("connect.title")}</h1>
			<p className="sy-connect__intro">{t("connect.intro")}</p>
			<form className="sy-connect__form" onSubmit={submit} noValidate autoComplete="off">
				<Input
					label={t("connect.token")}
					name="token"
					type="password"
					required
					value={token}
					onChange={(e) => setToken(e.target.value)}
					error={missing(token)}
					autoComplete="off"
					spellCheck={false}
					className="sy-ltr"
				/>
				<Input
					label={t("connect.tenant")}
					name="tenant"
					required
					value={tenantId}
					onChange={(e) => setTenantId(e.target.value)}
					error={missing(tenantId)}
					autoComplete="off"
					spellCheck={false}
					className="sy-ltr"
				/>
				<Input
					label={t("connect.grant")}
					name="grant"
					hint={t("connect.grantHint")}
					value={grantId}
					onChange={(e) => setGrantId(e.target.value)}
					autoComplete="off"
					spellCheck={false}
					className="sy-ltr"
				/>
				{message ? (
					<p className="sy-connect__error" role="alert" data-testid="connect-error">
						{message}
						{error?.requestId ? (
							<>
								{" "}
								<bdi dir="ltr" className="sy-ltr">
									<Identity value={error.requestId} label={t("record.technical")} />
								</bdi>
							</>
						) : null}
					</p>
				) : null}
				<Button type="submit" variant="primary" size="lg" loading={checking} data-testid="connect-submit">
					{checking ? t("connect.checking") : t("connect.submit")}
				</Button>
			</form>
		</Panel>
	);
}
