import { expect, type Page, test } from "@playwright/test";
const actor = "00000000-0000-4000-8000-000000000002";
const tenant = "00000000-0000-4000-8000-000000000001";
const own = "00000000-0000-4000-8000-000000000003";
const other = "00000000-0000-4000-8000-000000000004";
async function backend(page: Page) {
 let active = true;
 let rows = [own, other];
 let failure: string | null = null;
 let listFailure = false;
 const requests: Array<{path: string; body: unknown}> = [];
 await page.addInitScript(({ actor, tenant }) => sessionStorage.setItem("sy.workspaces", JSON.stringify({ actor, contexts: [{tenantId: tenant}] })), {actor, tenant});
 await page.route("**/v1/**", async route => {
  const req = route.request(), path = new URL(req.url()).pathname, body = req.postDataJSON();
  requests.push({path, body});
  let status = 200, json: unknown = {data: [], request_id: "fixture"};
  if (path === "/v1/auth/get-session") json = active ? {user: {id: actor}} : null;
  else if (path === "/v1/session") {status = active ? 200 : 401; json = active ? {data: {actor, configure: false, merge: false, audit: false, schema_read: false}} : {code: "UNAUTHENTICATED"};}
  else if (path === "/v1/auth/list-sessions") {
   if (listFailure) {status=503; json={code:"AUTH_UNAVAILABLE"};}
   else json=rows.map(id => ({id, userAgent: "متصفح English Browser", ipAddress: "127.0.0.1", expiresAt:"2026-11-01T12:00:00Z"}));
  } else if (path === "/v1/auth/change-password") {
   if (failure) {status=401; json={code:failure,message:"UPSTREAM MUST STAY HIDDEN"};}
   else {rows=[own]; json={success:true};}
  } else if (path === "/v1/auth/revoke-session") {
   rows=rows.filter(id => id !== body.sessionId); if(body.sessionId===own) active=false; json={success:true};
  } else if (path === "/v1/auth/revoke-other-sessions") {rows=[own]; json={success:true};}
  else if (path === "/v1/auth/revoke-sessions") {active=false; rows=[]; json={success:true};}
  await route.fulfill({status,json});
 });
 return {requests, fail:(code:string|null)=>{failure=code;}, listFail:(value:boolean)=>{listFailure=value;}};
}
async function password(page:Page) {
 await page.locator('input[name="current"]').fill("Synthetic-current-only!");
 await page.locator('input[name="password"]').fill("Synthetic-new-password!");
 await page.locator('input[name="confirm"]').fill("Synthetic-new-password!");
}
for (const locale of ["ar","en"]) for(const theme of ["light","dark"]) for(const width of [1440,375]) test(`security ${locale} ${theme} ${width}`,async({page},info)=>{
 const api=await backend(page);
 await page.addInitScript(({locale,theme})=>{localStorage.setItem("sy.locale",locale);localStorage.setItem("sy.theme",theme);},{locale,theme});
 await page.setViewportSize({width,height:900});
 await page.goto("/app/settings/security");
 await expect(page.getByTestId(`session-${other}`)).toBeVisible();
 await expect(page.getByTestId("security-password-submit")).toBeEnabled();
 await page.getByTestId("security-password-submit").click();
 await expect(page.locator('input[name="current"]')).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath("security.png")});
 await password(page); await page.getByTestId("security-password-submit").click();
 await expect(page.getByTestId(`session-${other}`)).toHaveCount(0);
 await expect(page.getByTestId("security-status")).toContainText(locale==="en"?"Password changed":"تم تغيير");
 for(const name of ["current","password","confirm"]) await expect(page.locator(`input[name="${name}"]`)).toHaveValue("");
 expect(api.requests.find(r=>r.path.endsWith("change-password"))?.body).toEqual({currentPassword:"Synthetic-current-only!",newPassword:"Synthetic-new-password!"});
 expect(await page.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}))).not.toMatch(/Synthetic-|"token"/);
 await expect(page.getByTestId("security-totp-deferred")).toBeVisible();
});
test("revokes stable ID, other sessions and all sessions with reconciliation",async({page})=>{
 const api=await backend(page); await page.goto("/app/settings/security");
 await page.getByTestId(`session-revoke-${other}`).click(); await page.getByTestId("dialog-confirm").click();
 await expect(page.getByTestId(`session-${other}`)).toHaveCount(0);
 expect(api.requests.find(r=>r.path.endsWith("revoke-session"))?.body).toEqual({sessionId:other});
 await page.getByTestId("security-others").click(); await page.getByTestId("dialog-confirm").click();
 await expect(page.getByTestId("security-others")).toBeEnabled();
 await page.getByTestId("security-all").click(); await page.getByTestId("dialog-confirm").click();
 await expect(page.getByTestId("sign-in-page")).toBeVisible();
});
test("revoking current session returns to sign-in",async({page})=>{
 await backend(page); await page.goto("/app/settings/security"); await page.getByTestId(`session-revoke-${own}`).click(); await page.getByTestId("dialog-confirm").click(); await expect(page.getByTestId("sign-in-page")).toBeVisible();
});
test("safe password error, stale-read disabling and explicit retry",async({page})=>{
 const api=await backend(page); await page.goto("/app/settings/security"); await password(page); api.fail("AUTH_INVALID_CREDENTIALS"); await page.getByTestId("security-password-submit").click();
 await expect(page.getByTestId("security-status")).toContainText("البريد الإلكتروني أو كلمة المرور غير صحيحة");
 await expect(page.locator('input[name="current"]')).toHaveValue(""); await expect(page.locator("body")).not.toContainText("UPSTREAM");
 api.listFail(true); await page.getByTestId("security-refresh").click(); await expect(page.getByTestId("security-password-submit")).toBeDisabled();
 api.listFail(false); await page.getByTestId("security-refresh").click(); await expect(page.getByTestId("security-password-submit")).toBeEnabled();
 expect(api.requests.filter(r=>r.path.endsWith("change-password"))).toHaveLength(1);
});
