import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { authClient, sessionStore, ApiError, networkError } from "../../api/index.ts";
import type { AuthSession } from "../../api/auth.ts";
import { Button, Dialog, EmptyState, Input, LoadingState, PageHeader, useI18n } from "../../ui/index.ts";
import { authErrorKey } from "./errors.ts";

type Confirmation = { kind: "one" | "others" | "all"; id?: string };
/** Account recovery is cookie scoped. Stable IDs are sent; session tokens never enter UI state. */
export function SecurityView({ enabled }: { enabled: boolean }) {
 const { t, locale } = useI18n();
 const [sessions, setSessions] = useState<AuthSession[]>([]);
 const [loading, setLoading] = useState(true);
 const [fresh, setFresh] = useState(false);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState<ApiError | null>(null);
 const [notice, setNotice] = useState<"updated" | "changed" | null>(null);
 const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
 const [current, setCurrent] = useState("");
 const [password, setPassword] = useState("");
 const [confirm, setConfirm] = useState("");
 const [touched, setTouched] = useState(false);
 const mounted = useRef(false);
 const version = useRef(0);
 const pending = useRef(false);
 const form = useRef<HTMLFormElement>(null);
 const status = useRef<HTMLParagraphElement>(null);
 const load = useCallback(async (clearError = true) => {
  if (!enabled) return;
  const mine = ++version.current;
  setLoading(true); setFresh(false);
  if (clearError) setError(null);
  try {
   const rows = await authClient.listSessions();
   if (!mounted.current || mine !== version.current) return;
   setSessions(rows); setFresh(true);
  } catch (e) {
   if (!mounted.current || mine !== version.current) return;
   const failure = e instanceof ApiError ? e : networkError();
   setError(failure); setSessions([]);
   if (failure.status === 401) sessionStore.invalidate(failure);
  } finally {
   if (mounted.current && mine === version.current) setLoading(false);
  }
 }, [enabled]);
 useEffect(() => {
  mounted.current = true; void load();
  return () => { mounted.current = false; version.current++; };
 }, [load]);
 useEffect(() => { if (error || notice) status.current?.focus(); }, [error, notice]);
 async function run(action: () => Promise<unknown>, message: "updated" | "changed", all = false) {
  if (!enabled || pending.current || !fresh) return;
  pending.current = true; setBusy(true); setFresh(false); setError(null); setNotice(null);
  try {
   await action();
   if (!mounted.current) return;
   setConfirmation(null);
   if (all) { sessionStore.invalidate(); return; }
   // Never repeat uncertain password/revoke mutations. Revalidate the rotated or revoked cookie first.
   if (!await sessionStore.recheck() || !mounted.current) return;
   setNotice(message);
  } catch (e) {
   if (!mounted.current) return;
   const failure = e instanceof ApiError ? e : networkError();
   setError(failure); setConfirmation(null);
   if (failure.status === 401 && failure.code !== "AUTH_INVALID_CREDENTIALS") { sessionStore.invalidate(failure); return; }
  } finally {
   if (mounted.current) { await load(false); setBusy(false); }
   pending.current = false;
  }
 }
 const currentError = !current ? t("auth.required") : undefined;
 const passwordError = !password ? t("auth.required") : password.length < 12 || password.length > 128 ? t("auth.passwordHint") : undefined;
 const confirmError = password !== confirm ? t("auth.passwordMismatch") : undefined;
 const disabled = busy || loading || !fresh;
 function change(event: FormEvent) {
  event.preventDefault();
  if (disabled || pending.current) return;
  setTouched(true);
  if (currentError || passwordError || confirmError) {
   form.current?.querySelector<HTMLInputElement>(`input[name="${currentError ? "current" : passwordError ? "password" : "confirm"}"]`)?.focus(); return;
  }
  const enteredCurrent = current, enteredNew = password;
  setCurrent(""); setPassword(""); setConfirm(""); setTouched(false);
  void run(() => authClient.changePassword(enteredCurrent, enteredNew), "changed");
 }
 function date(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
 }
 if (!enabled) return <EmptyState title={t("error.forbidden")} />;
 return <section className="grid min-w-0 gap-24" data-testid="security-page">
  <PageHeader title={t("nav.security")} subtitle={t("security.intro")} actions={<Button disabled={busy || loading} onClick={() => { setNotice(null); void load(); }} data-testid="security-refresh">{t("security.refresh")}</Button>} />
  {error || notice ? <p ref={status} tabIndex={-1} role={error ? "alert" : "status"} className={`m-0 ${error ? "text-danger-fg" : "text-text"}`} data-testid="security-status">{error ? t(authErrorKey(error)) : t(notice === "changed" ? "security.changed" : "security.updated")} {error && !fresh ? t("security.reconcile") : ""}</p> : null}
  <section className="grid gap-12 min-w-0" aria-labelledby="sessions-title">
   <h2 id="sessions-title" className="m-0 font-heading">{t("security.sessions")}</h2>
   <div className="flex flex-wrap gap-8"><Button disabled={disabled} onClick={() => setConfirmation({ kind: "others" })} data-testid="security-others">{t("security.others")}</Button><Button disabled={disabled} variant="danger" onClick={() => setConfirmation({ kind: "all" })} data-testid="security-all">{t("security.all")}</Button></div>
   {loading ? <LoadingState /> : sessions.length ? sessions.map(row => <article key={row.id} className="grid min-w-0 gap-12 rounded-12 border border-solid border-border bg-surface p-16 sm:grid-cols-[minmax(0,1fr)_auto]" data-testid={`session-${row.id}`}>
    <div className="min-w-0"><bdi dir="auto" className="[overflow-wrap:anywhere]">{row.userAgent || "—"}</bdi><p className="m-0 text-text-2">{t("security.expires")}: <bdi>{date(row.expiresAt)}</bdi></p>{row.ipAddress ? <bdi dir="ltr">{row.ipAddress}</bdi> : null}</div>
    <Button variant="danger" disabled={disabled} onClick={() => setConfirmation({ kind: "one", id: row.id })} data-testid={`session-revoke-${row.id}`}>{t("security.revoke")}</Button>
   </article>) : <EmptyState title={t("security.empty")} />}
  </section>
  <form ref={form} onSubmit={change} noValidate className="grid gap-12 rounded-12 border border-solid border-border bg-surface p-16" data-testid="security-password-form">
   <h2 className="m-0 font-heading">{t("security.password")}</h2>
   <Input label={t("security.current")} type="password" name="current" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} required disabled={disabled} error={touched ? currentError : undefined} />
   <Input label={t("auth.newPassword")} type="password" name="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required disabled={disabled} hint={t("auth.passwordHint")} error={touched ? passwordError : undefined} />
   <Input label={t("auth.confirmPassword")} type="password" name="confirm" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required disabled={disabled} error={touched ? confirmError : undefined} />
   <Button type="submit" variant="primary" disabled={disabled} loading={busy} data-testid="security-password-submit">{t("security.password")}</Button>
  </form>
  <p className="m-0 text-text-2" data-testid="security-totp-deferred">{t("security.totp")}</p>
  <Dialog open={!!confirmation} title={t(confirmation?.kind === "all" ? "security.all" : confirmation?.kind === "others" ? "security.others" : "security.revoke")} onClose={() => { if (!busy) setConfirmation(null); }} confirm={{ label: t("security.revoke"), loading: busy, onConfirm: () => { if (confirmation) void run(() => confirmation.kind === "one" ? authClient.revokeSession(confirmation.id ?? "") : confirmation.kind === "others" ? authClient.revokeOtherSessions() : authClient.revokeSessions(), "updated", confirmation.kind === "all"); } }}><p>{t("security.confirm")}</p></Dialog>
 </section>;
}
