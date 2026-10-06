// Demo data seeder for a LOCAL dev tenant. Public HTTP API only; synthetic data only.
//
//   npm run seed:demo
//
// Reads the local fixture (tokens.manager, ids.a) in memory and never prints or writes it.
// Env overrides: CRM_API_URL (default http://127.0.0.1:4317), CRM_FIXTURE (default local-fixture.json).
//
// Rerun safety: every record is marked "[DEMO]" (lead/deal/task titles, campaign names) and each
// phase first reads current state through GET, creating only what is missing and converging
// statuses/stages/completion. Command ids are derived deterministically from the record index.
// Refuses to run against a non-loopback API.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const BASE = process.env.CRM_API_URL ?? "http://127.0.0.1:4317";
if (!/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(BASE))
	throw new Error("seed:demo only targets a loopback API");
const fixture = JSON.parse(
	readFileSync(process.env.CRM_FIXTURE ?? "local-fixture.json", "utf8"),
) as { ids: { a: string }; tokens: { manager: string } };
const TENANT = fixture.ids.a;
const PREFIX = "[DEMO]";

// biome-ignore lint/suspicious/noExplicitAny: demo seed script consumes loosely-typed API JSON
type Json = Record<string, any>;
type Row = Json & { id: string; version: number };

// Deterministic UUID (v5-shaped) from a label so retries reuse the same command id.
function uid(label: string): string {
	const h = createHash("sha1").update(`tsst-crm-demo:${label}`).digest();
	h[6] = (h[6] & 0x0f) | 0x50;
	h[8] = (h[8] & 0x3f) | 0x80;
	const x = h.subarray(0, 16).toString("hex");
	return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

// Journey intake routes reject unknown fields; only identities carry a command_id there.
const withCommand = (path: string) => !path.startsWith("/v1/journey/") || path === "/v1/journey/identities";

async function api(
	method: string,
	path: string,
	body?: Json,
	label?: string,
): Promise<Json> {
	for (let attempt = 0; attempt < 4; attempt++) {
		const key = label ? uid(label) : undefined;
		const res = await fetch(`${BASE}${path}`, {
			method,
			headers: {
				Authorization: `Bearer ${fixture.tokens.manager}`,
				"X-Tenant-ID": TENANT,
				...(body ? { "Content-Type": "application/json" } : {}),
				...(method !== "GET" && key ? { "Idempotency-Key": key } : {}),
			},
			body: body ? JSON.stringify(key && withCommand(path) ? { command_id: key, ...body } : body) : undefined,
		});
		if (res.status === 429 && attempt < 3) {
			await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
			continue;
		}
		const json = (await res.json().catch(() => ({}))) as Json;
		if (!res.ok)
			throw new Error(
				`${method} ${path.split("?")[0]} -> ${res.status} ${json.code ?? ""} (${label ?? ""})`,
			);
		return json;
	}
	throw new Error("unreachable");
}

async function listAll(path: string): Promise<Row[]> {
	const out: Row[] = [];
	let cursor: string | null = null;
	do {
		const sep = path.includes("?") ? "&" : "?";
		const j: Json = await api("GET", cursor ? `${path}${sep}cursor=${cursor}` : path);
		out.push(...(j.data as Row[]));
		cursor = (j.next_cursor as string | null) ?? null;
	} while (cursor);
	return out;
}

// Deterministic pseudo-random so reruns agree.
let seedState = 20261006;
const rnd = () => {
	seedState = (Math.imul(seedState, 1664525) + 1013904223) >>> 0;
	return seedState / 2 ** 32;
};

const HOUR = 3600_000;
const DAY = 24 * HOUR;
const now = Date.now();
// Fixed anchor for collected events so a retried event is a byte-identical replay (a moving
// timestamp would be a 409 'changed payload'). Touches fall 1-9 days before 2026-10-01.
const ANCHOR = Date.UTC(2026, 9, 1);
const iso = (ms: number) => new Date(ms).toISOString();
const pad = (n: number, w = 2) => String(n).padStart(w, "0");

const counts: Record<string, { created: number; existing: number }> = {};
const tally = (k: string, created: boolean) => {
	counts[k] ??= { created: 0, existing: 0 };
	if (created) counts[k].created++;
	else counts[k].existing++;
};

// ---- people -------------------------------------------------------------
const arFirst = ["محمد", "أحمد", "محمود", "مصطفى", "عمر", "يوسف", "كريم", "طارق", "هشام", "خالد", "فاطمة", "سارة", "نور", "منى", "هدى", "ياسمين", "دينا", "ريم", "ليلى", "أميرة"];
const arLast = ["علي", "حسن", "إبراهيم", "السيد", "عبد الله", "سالم", "فؤاد", "منصور", "شريف", "الشافعي"];
const enFirst = ["Sara", "Omar", "Layla", "Karim", "Nadia", "Youssef", "Hana", "Tamer", "Mona", "Adel", "Rania", "Hossam", "Dina", "Waleed", "Salma", "Ziad", "Heba", "Amr", "Farah", "Sherif"];
const enLast = ["Hassan", "Ibrahim", "Mansour", "Fouad", "Saleh", "Nasser", "Khalil", "Farouk", "Gamal", "Rashad"];
const sources = ["referral", "instagram", "website", "walk-in", "facebook", "whatsapp", "phone call", "exhibition"];
const names: string[] = [];
for (let i = 0; names.length < 60; i++) {
	const ar = i % 2 === 0;
	const n = Math.floor(i / 2);
	const f = (ar ? arFirst : enFirst)[n % 20] as string;
	const l = (ar ? arLast : enLast)[(n * 3 + Math.floor(n / 20)) % 10] as string;
	const name = `${f} ${l}`;
	if (!names.includes(name)) names.push(name);
}
const projectAr = ["مطبخ جديد بالكامل", "تجديد دواليب المطبخ", "تغيير الرخام", "إضافة جزيرة"];
const projectEn = ["Full kitchen", "Cabinet refresh", "Countertop replacement", "Island add-on"];

async function main() {
	const session = (await api("GET", "/v1/session")).data as Json;
	if (!session.actor) throw new Error("no session actor");
	const assignees = ((await api("GET", "/v1/assignees")).data as Json[]).map((a) => a.id as string);
	const owner = (i: number) => (assignees.length ? { owner_id: assignees[i % assignees.length] } : {});

	// ---- pipeline ----------------------------------------------------------
	const PIPE_NAME = "مبيعات المطابخ / Kitchen sales";
	const stageNames = ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
	let pipe = ((await api("GET", "/v1/pipelines")).data as Json[]).find((p) => p.name === PIPE_NAME);
	tally("pipeline", !pipe);
	if (!pipe) {
		await api(
			"POST",
			"/v1/pipelines",
			{
				name: PIPE_NAME,
				stages: [
					{ name: "New" },
					{ name: "Qualified" },
					{ name: "Proposal" },
					{ name: "Negotiation" },
					{ name: "Won", outcome: "won" },
					{ name: "Lost", outcome: "lost" },
				],
				transitions: [[0, 1], [0, 5], [1, 2], [1, 5], [2, 3], [2, 5], [3, 4], [3, 5]],
			},
			"pipeline",
		);
		pipe = ((await api("GET", "/v1/pipelines")).data as Json[]).find((p) => p.name === PIPE_NAME);
	}
	if (!pipe) throw new Error("pipeline missing after create");
	const stageId: Record<string, string> = {};
	for (const s of pipe.stages as Json[]) stageId[s.name] = s.id;
	for (const n of stageNames) if (!stageId[n]) throw new Error(`stage ${n} missing`);
	const stageName = (id: string) => stageNames.find((n) => stageId[n] === id) ?? "?";

	// ---- leads + inline contacts --------------------------------------------
	const leadTitle = (i: number) => {
		const ar = i % 2 === 0;
		const p = (ar ? projectAr : projectEn)[i % 4];
		return `${PREFIX} ${ar ? "استفسار" : "Inquiry"}: ${p} #${pad(i + 1)}`;
	};
	let leads = await listAll("/v1/leads");
	const leadByTitle = () => new Map(leads.map((l) => [l.title as string, l]));
	for (let i = 0; i < 60; i++) {
		const title = leadTitle(i);
		if (leadByTitle().has(title)) {
			tally("leads", false);
			continue;
		}
		const identifiers: Json[] = [];
		if (i % 3 !== 1)
			identifiers.push({ kind: "email", value: `demo.lead${pad(i + 1)}@example.com`, provenance: "demo_seed" });
		if (i % 3 !== 2)
			identifiers.push({ kind: "phone", value: `+2010000${pad(i + 1, 5)}`, provenance: "demo_seed" });
		const r = await api(
			"POST",
			"/v1/leads",
			{
				title,
				source_evidence: "Synthetic demo data",
				...owner(i),
				contact: { display_name: names[i] as string, source: sources[i % sources.length], identifiers },
			},
			`lead:${i}`,
		);
		leads.push(r.data as Row);
		tally("leads", true);
	}
	leads = await listAll("/v1/leads");

	// Near-duplicate contact pair sharing one email (merge-flow practice).
	const contacts0 = await listAll("/v1/contacts");
	const dupSpecs = [
		{ name: "Ahmed Mostafa", n: 0 },
		{ name: "Ahmad Mostafa", n: 1 },
	];
	for (const d of dupSpecs) {
		const have = contacts0.some((c) => c.display_name === d.name);
		tally("contacts(duplicate pair)", !have);
		if (!have)
			await api(
				"POST",
				"/v1/contacts",
				{
					display_name: d.name,
					source: "referral",
					identifiers: [
						{ kind: "email", value: "demo.dup.mostafa@example.com", provenance: "demo_seed" },
						{ kind: "phone", value: `+201000099${pad(d.n + 1, 3)}`, provenance: "demo_seed" },
					],
				},
				`dupcontact:${d.n}`,
			);
	}

	// ---- deals ---------------------------------------------------------------
	const stagePlan: string[] = [
		...Array(4).fill("New"),
		...Array(4).fill("Qualified"),
		...Array(5).fill("Proposal"),
		...Array(4).fill("Negotiation"),
		...Array(5).fill("Won"),
		...Array(3).fill("Lost"),
	];
	const lostReasons = ["Chose another supplier", "Budget too low", "Project postponed"];
	const path: Record<string, string[]> = {
		New: [],
		Qualified: ["Qualified"],
		Proposal: ["Qualified", "Proposal"],
		Negotiation: ["Qualified", "Proposal", "Negotiation"],
		Won: ["Qualified", "Proposal", "Negotiation", "Won"],
		Lost: ["Qualified", "Proposal", "Lost"],
	};
	const dealPlan = Array.from({ length: 25 }, (_, j) => ({
		j,
		leadIdx: Math.floor((j * 60) / 25),
		target: stagePlan[(j * 7) % 25] as string,
		amount: (15000 + Math.round((rnd() * (450000 - 15000)) / 500) * 500) * 100,
	}));
	let deals = await listAll("/v1/deals");
	const dealTitle = (leadIdx: number, j: number) => `${PREFIX} Kitchen project: ${names[leadIdx]} (${pad(j + 1)})`;
	for (const d of dealPlan) {
		const lead = leads.find((l) => l.title === leadTitle(d.leadIdx));
		if (!lead) throw new Error(`lead ${d.leadIdx} missing`);
		const title = dealTitle(d.leadIdx, d.j);
		if (deals.some((x) => x.title === title)) {
			tally("deals", false);
			continue;
		}
		await api(
			"POST",
			"/v1/deals",
			{
				contact_id: lead.contact_id,
				lead_id: lead.id,
				pipeline_id: pipe.id,
				stage_id: stageId.New,
				title,
				amount_minor: d.amount,
				currency: "EGP",
				...owner(d.leadIdx),
			},
			`deal:${d.j}`,
		);
		tally("deals", true);
	}
	deals = await listAll("/v1/deals");
	const transitionsDone: Record<string, number> = {};
	for (const d of dealPlan) {
		const deal = deals.find((x) => x.title === dealTitle(d.leadIdx, d.j));
		if (!deal) throw new Error(`deal ${d.j} missing`);
		let version = deal.version;
		let current = stageName(deal.stage_id);
		const steps = path[d.target] as string[];
		const at = steps.indexOf(current);
		for (const next of steps.slice(at + 1)) {
			if (current === d.target) break;
			await api(
				"POST",
				`/v1/deals/${deal.id}/transitions`,
				{
					to_stage_id: stageId[next],
					expected_version: version,
					reason: next === "Lost" ? (lostReasons[d.j % 3] as string) : "Demo progress",
				},
				`transition:${d.j}:${next}`,
			);
			version++;
			current = next;
			transitionsDone[next] = (transitionsDone[next] ?? 0) + 1;
		}
	}
	deals = await listAll("/v1/deals");

	// ---- lead status convergence (after deals so statuses agree with deal outcome) ----
	leads = await listAll("/v1/leads");
	const statusFor = (i: number) => {
		const plan = dealPlan.find((d) => d.leadIdx === i);
		if (plan) return plan.target === "New" ? "open" : plan.target === "Won" || plan.target === "Lost" ? "closed" : "qualified";
		const m = i % 10;
		return m <= 5 ? "open" : m <= 7 ? "qualified" : "closed";
	};
	for (let i = 0; i < 60; i++) {
		const lead = leads.find((l) => l.title === leadTitle(i));
		if (!lead) continue;
		const want = statusFor(i);
		if (lead.status !== want) {
			await api("PATCH", `/v1/leads/${lead.id}`, { expected_version: lead.version, status: want }, `leadstatus:${i}:${want}`);
			tally("lead status updates", true);
		}
	}
	leads = await listAll("/v1/leads");

	// ---- tasks ---------------------------------------------------------------
	const taskText: Array<[string, string]> = [
		["اتصال لتأكيد المقاسات", "Call to confirm measurements"],
		["إرسال عرض السعر", "Send quotation"],
		["متابعة العرض", "Follow up on proposal"],
		["ترتيب زيارة المعرض", "Schedule showroom visit"],
		["تحصيل العربون", "Collect deposit"],
		["تأكيد موعد التسليم", "Confirm delivery date"],
	];
	// 0-5 overdue, 6-11 due within 24h, 12-21 upcoming, 22-29 completed
	const dueFor = (k: number) =>
		k < 6 ? now - (k + 1) * 0.8 * DAY - 2 * HOUR
		: k < 12 ? now + (k - 5) * 3 * HOUR
		: k < 22 ? now + (k - 10) * DAY + 3 * HOUR
		: now - (k - 21) * DAY;
	const taskTitle = (k: number) => `${PREFIX} ${(taskText[k % 6] as [string, string])[k % 2]} #${pad(k + 1)}`;
	let tasks = await listAll("/v1/tasks");
	const dealsOf = deals.filter((d) => String(d.title).startsWith(PREFIX));
	for (let k = 0; k < 30; k++) {
		const title = taskTitle(k);
		if (tasks.some((t) => t.title === title)) {
			tally("tasks", false);
			continue;
		}
		const onDeal = k % 3 === 0 && dealsOf.length > 0;
		const link = onDeal
			? { deal_id: (dealsOf[(k / 3) % dealsOf.length] as Row).id }
			: { contact_id: (leads.find((l) => l.title === leadTitle((k * 2) % 60)) as Row).contact_id };
		await api("POST", "/v1/tasks", { title, due_at: iso(dueFor(k)), ...link, ...owner(k) }, `task:${k}`);
		tally("tasks", true);
	}
	tasks = await listAll("/v1/tasks");
	for (let k = 22; k < 30; k++) {
		const t = tasks.find((x) => x.title === taskTitle(k));
		if (t && t.status !== "completed") {
			await api("PATCH", `/v1/tasks/${t.id}`, { expected_version: t.version, status: "completed" }, `taskdone:${k}`);
			tally("tasks completed", true);
		}
	}

	// ---- campaigns, spend, events, attribution (public journey API) -----------------
	const attribution: Record<string, string> = {};
	try {
		const site = (
			await api(
				"POST",
				"/v1/journey/sites",
				{ id: uid("site"), origin: "https://demo.example.com", enabled: true },
				"site",
			)
		).data as Json;
		const campaignDefs = [
			{ source: "instagram", external_id: "demo-ig-1", name: `${PREFIX} Instagram: Kitchen showcase` },
			{ source: "search", external_id: "demo-search-1", name: `${PREFIX} Search: Kitchens` },
			{ source: "facebook", external_id: "demo-fb-1", name: `${PREFIX} Facebook: Offers` },
		];
		const campaigns: Json[] = [];
		for (const c of campaignDefs)
			campaigns.push(
				(
					await api(
						"POST",
						"/v1/journey/campaigns",
						{ ...c, account_id: "demo-seed", currency: "EGP", timezone: "Africa/Cairo" },
						`campaign:${c.external_id}`,
					)
				).data as Json,
			);
		for (const [ci, c] of campaigns.entries())
			for (let d = 1; d <= 7; d++)
				await api(
					"POST",
					"/v1/journey/spend",
					{
						campaign_id: c.id,
						reporting_date: iso(now - d * DAY).slice(0, 10),
						currency: "EGP",
						spend_minor: (800 + ci * 350 + ((d * 137 + ci * 61) % 400)) * 100,
					},
					`spend:${ci}:${d}`,
				);
		attribution.campaigns = String(campaigns.length);
		attribution.spend_rows = String(campaigns.length * 7);

		const already = ((await api("GET", "/v1/journey/identities")).data as Json[]).length > 0;
		let created = false;
		if (!already) {
			const wonContacts = dealPlan
				.filter((d) => d.target === "Won")
				.map((d) => (leads.find((l) => l.title === leadTitle(d.leadIdx)) as Row).contact_id as string);
			const extraContacts = [1, 3, 5, 7, 9, 11]
				.map((i) => leads.find((l) => l.title === leadTitle(i))?.contact_id as string | undefined)
				.filter((x): x is string => !!x && !wonContacts.includes(x));
			const linked = [...wonContacts, ...extraContacts];
			let events = 0;
			let links = 0;
			for (const [k, contact] of linked.entries()) {
				const visitor = uid(`visitor:${k}`);
				const session = uid(`session:${k}`);
				const first = campaigns[k % 3] as Json;
				const last = campaigns[k % 2 === 0 ? k % 3 : (k + 1) % 3] as Json;
				const mk = (name: string, camp: Json, agoMs: number, tag: string) => ({
					event_id: uid(`event-v2:${k}:${tag}`),
					visitor_id: visitor,
					session_id: session,
					name,
					schema_version: 1,
					occurred_at: iso(ANCHOR - agoMs),
					consent: { analytics: true, advertising: true },
					landing_path: "/kitchens",
					source: camp.source,
					campaign_id: camp.id,
				});
				await collect(site.public_key as string, site.origin as string, mk("page_view", first, (9 - (k % 5)) * DAY, "pv"));
				events++;
				const form = await collect(site.public_key as string, site.origin as string, mk("form_submitted", last, (4 - (k % 3)) * DAY, "form"));
				events++;
				const formBody = mk("form_submitted", last, 0, "form");
				const visitorInternal = (await api("GET", `/v1/journey/events/${form.id}`)).data.visitor_id as string;
				await api(
					"POST",
					"/v1/journey/identities",
					{
						visitor_id: visitorInternal,
						contact_id: contact,
						evidence_type: "form",
						evidence_ref: formBody.event_id,
						evidence_event_id: form.id,
						valid_from: iso(now - 90 * DAY),
						valid_to: iso(now + DAY),
					},
					`identity:${k}`,
				);
				links++;
			}
			let orders = 0;
			for (const [k, contact] of extraContacts.slice(0, 4).entries()) {
				const base = {
					source: "demo",
					external_order_id: uid(`order:${k}`),
					occurred_at: iso(now - 2 * HOUR),
					currency: "EGP",
					amount_minor: (25000 + k * 18000) * 100,
					contact_id: contact,
				};
				await api("POST", "/v1/journey/commerce", { ...base, source_event_id: uid(`order-ev:${k}`), kind: "order", status: "placed" }, `order:${k}`);
				await api("POST", "/v1/journey/commerce", { ...base, source_event_id: uid(`pay-ev:${k}`), kind: "payment", external_id: uid(`pay:${k}`) }, `pay:${k}`);
				orders++;
			}
			attribution.events = String(events);
			attribution.identity_links = String(links);
			attribution.orders_with_payment = String(orders);
			created = true;
		}
		const report0 = (await api("GET", "/v1/reports/campaign-performance")).data as Json;
		if (created || !report0.run_id) {
			const run = (await api("POST", "/v1/journey/calculate", { lookback_days: 90 }, `calc:${created ? "a" : "b"}:${iso(now).slice(0, 10)}`)).data as Json;
			attribution.published_run = run?.id ? "yes" : "unknown";
		} else attribution.published_run = "existing run kept";
	} catch (e) {
		attribution.skipped = (e as Error).message;
	}

	console.log("--- created / already-present ---");
	for (const [k, v] of Object.entries(counts)) console.log(`${k}: created=${v.created} existing=${v.existing}`);
	console.log("transitions performed:", JSON.stringify(transitionsDone));
	console.log("attribution:", JSON.stringify(attribution));
}

// Public collector: no CRM authority, site key + Origin only. Key is never printed.
async function collect(siteKey: string, origin: string, body: Json): Promise<Json> {
	const res = await fetch(`${BASE}/v1/collect/events`, {
		method: "POST",
		headers: { "Content-Type": "application/json", "X-Site-Key": siteKey, Origin: origin },
		body: JSON.stringify(body),
	});
	const json = (await res.json().catch(() => ({}))) as Json;
	if (res.status !== 202) throw new Error(`POST /v1/collect/events -> ${res.status} ${json.code ?? ""}`);
	return json.data as Json;
}

main().catch((e) => {
	console.error(`seed:demo failed: ${(e as Error).message}`);
	process.exit(1);
});
