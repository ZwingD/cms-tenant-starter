// scripts/seed-northwind-demo.mjs
/**
 * Seed the "Northwind Academy" demo tenant (realm `northwind`) into cms-api-dev for
 * the navigation mega-menu north-star demo. Idempotent (list-then-branch: the CMS
 * admin API is create-POST + update-PUT-by-id, no upsert). ZERO cms-backend change -
 * pure admin-API authoring with a minted CMS_ADMIN JWT (the net-new realm has no
 * real user; the first authed call lazy-upserts the cms_tenants row).
 *
 * Authors: a `northwind-core` category + 3 published course-landings assigned to it
 * (-> the live CatalogList) + a `header` nav item with a curated LinkGroup
 * (children[]) + a hybrid mega-menu (dynlist CatalogList + inline.card Promo).
 *
 * Run: CMS_BASE=https://cms-api-dev.zwingd.com CMS_TENANT_REALM=northwind \
 *      node scripts/seed-northwind-demo.mjs
 *
 * Introduced: navigation mega-menu north-star demo.
 */
import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";

const CMS_BASE = process.env.CMS_BASE || "https://cms-api-dev.zwingd.com";
const REALM = process.env.CMS_TENANT_REALM || "northwind";
const SSM_PARAM = process.env.CMS_JWT_SSM_PARAM || "/zwingd-cms/dev/jwt-secret-key";
const CAT_SLUG = "northwind-core";

const COURSES = [
  { code: "nw-data-science", headline: "Foundations of Data Science" },
  { code: "nw-applied-ml", headline: "Applied Machine Learning" },
  { code: "nw-cloud-arch", headline: "Cloud Architecture & DevOps" },
];

function fail(msg) {
  console.error(`\n[seed] FATAL: ${msg}`);
  process.exit(1);
}

// --- Mint a CMS_ADMIN JWT (HS256) from the SSM secret (fail-loud) ---
const b64url = (s) => Buffer.from(s).toString("base64url");
function mintJwt(secret) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: "northwind-seed",
    cms_roles: ["CMS_ADMIN"],
    tenant: { realm: REALM },
    iat: now,
    exp: now + 600, // 10 min - comfortably longer than the whole seed run
  };
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

let secret;
try {
  // execFileSync (argv array, no shell) - SSM_PARAM is env-controlled, so avoid
  // interpolating it into a shell string (no shell-injection surface).
  secret = execFileSync(
    "aws",
    [
      "ssm",
      "get-parameter",
      "--name",
      SSM_PARAM,
      "--with-decryption",
      "--query",
      "Parameter.Value",
      "--output",
      "text",
    ],
    { encoding: "utf8" },
  ).trim();
} catch (e) {
  fail(`could not read SSM param ${SSM_PARAM} (AWS creds / access): ${e.message}`);
}
if (!secret || secret === "None") fail(`SSM param ${SSM_PARAM} is empty`);
const JWT = mintJwt(secret);

// --- admin API helper (fail-loud on any non-OK) ---
/**
 * @param {number[]} [tolerate] HTTP statuses to return instead of aborting, as
 *   `{ __status }`. Fail-loud stays the DEFAULT -- opt in per call site, and
 *   only where the caller can explain what the status means and carry on.
 */
async function api(method, path, body, tolerate = []) {
  const res = await fetch(`${CMS_BASE}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      realm: REALM,
      authorization: `Bearer ${JWT}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) {
    if (tolerate.includes(res.status)) return { __status: res.status };
    fail(
      `${method} ${path} -> ${res.status}: ${typeof json === "string" ? json : JSON.stringify(json)}`,
    );
  }
  return json;
}

/** Normalize a list response (array | {items} | {data}) to an array. */
const asArray = (r) =>
  Array.isArray(r) ? r : (r?.items ?? r?.data ?? r?.results ?? []);

// --- Category (list-then-branch) ---
async function ensureCategory() {
  const existing = asArray(await api("GET", "/api/admin/categories")).find(
    (c) => c?.slug === CAT_SLUG,
  );
  if (existing?.id) {
    await api("PUT", `/api/admin/categories/${existing.id}`, {
      name: "Northwind Core",
    });
    return existing.id;
  }
  const created = await api("POST", "/api/admin/categories", {
    name: "Northwind Core",
    slug: CAT_SLUG,
  });
  return created.id;
}

// --- Course-landings (list-then-branch + publish) ---
async function ensureCourse(categoryId, c) {
  const existing = asArray(await api("GET", "/api/admin/course-landings")).find(
    (x) => (x?.code ?? x?.slug) === c.code,
  );
  const body = {
    headline: c.headline,
    zwingdCourseId: c.code,
    code: c.code,
    slug: c.code,
    sections: [],
    categoryId,
  };
  let id;
  if (existing?.id) {
    await api("PUT", `/api/admin/course-landings/${existing.id}`, body);
    id = existing.id;
  } else {
    // A 409 here means the slug is reserved by a row this list cannot see --
    // in practice a SOFT-DELETED course-landing, which stays in the unique
    // index while being filtered out of every admin list. list-then-branch is
    // structurally blind to that, so the create collides with a row it had no
    // way to find. Warn loudly and carry on: the courses are demo garnish, and
    // aborting here would take the nav + footer authoring down with them.
    const created = await api("POST", "/api/admin/course-landings", body, [409]);
    if (created?.__status === 409) {
      console.warn(
        `[seed] WARN: course ${c.code} conflicts with a hidden (likely soft-deleted) row -- skipping. ` +
          `The demo CatalogList will be short one course until that row is purged or its slug freed.`,
      );
      return null;
    }
    id = created.id;
  }
  await api("POST", `/api/admin/course-landings/${id}/publish`, {});
  return id;
}

// --- Nav header (curated LinkGroup + hybrid mega-menu) ---
async function putNav() {
  const megaMenu = {
    columns: 2,
    rows: 1,
    cells: [
      {
        archetype: "dynlist",
        variant: "nav",
        header: { heading: "Courses" },
        source: { query: `category:${CAT_SLUG}`, limit: 12 },
      },
      {
        archetype: "inline",
        variant: "card",
        header: { heading: "Winter cohort is open", eyebrow: "Enrolling now" },
      },
    ],
  };
  await api("PUT", "/api/admin/navigation/header", {
    items: [
      {
        label: "Programs",
        url: "#",
        children: [
          { label: "All Courses", url: "/courses" },
          { label: "Certifications", url: "/certifications" },
          { label: "About Northwind", url: "/about" },
        ],
        megaMenu,
      },
    ],
  });
}

// --- Nav footer (link columns; no mega-menu -- the footer is a link list) ---
async function putFooterNav() {
  await api("PUT", "/api/admin/navigation/footer", {
    items: [
      {
        label: "Programs",
        url: "#",
        children: [
          { label: "All Courses", url: "/courses" },
          { label: "Certifications", url: "/certifications" },
        ],
      },
      {
        label: "Company",
        url: "#",
        children: [
          { label: "About Northwind", url: "/about" },
          { label: "Careers", url: "/careers" },
        ],
      },
      {
        label: "Support",
        url: "#",
        children: [
          { label: "Help Centre", url: "/help" },
          { label: "Contact", url: "/contact" },
        ],
      },
    ],
  });
}

// --- Footer chrome (social + legal + copyright on the site-settings blob) ---
async function putFooterChrome() {
  // READ-THEN-WRITE, not a blind PUT: UpdateSiteSettingsDto.siteName is
  // @IsString() @IsNotEmpty(), so a body without it 422s. The GET also
  // lazy-upserts the settings row for a net-new realm (SiteSettingsService.find),
  // so this works on a realm that has never had settings saved.
  const current = await api("GET", "/api/admin/site-settings");
  const siteName = current?.siteName || "Northwind Academy";

  // Send ONLY siteName + footerConfig. The server deep-merges chrome blobs
  // (deepMergePreserve in site-settings.service.ts), so omitting headerConfig /
  // lpHeaderConfig leaves them untouched rather than wiping them.
  await api("PUT", "/api/admin/site-settings", {
    siteName,
    footerConfig: {
      // REQUIRED even though the logo slot is deferred: FooterConfigSchema
      // declares `logo: MediaRefSchema.nullable()` -- nullable, but NOT
      // optional, so omitting the key entirely fails validation with
      // "expected object, received undefined". Explicit null is how you say
      // "no logo"; leaving it out is a 400.
      logo: null,
      // `platform` must be one of the SocialLinkSchema enum values and `href`
      // must be an ABSOLUTE url (z.url()) -- one bad entry 400s the whole PUT.
      socialLinks: [
        { platform: "linkedin", href: "https://www.linkedin.com/company/northwind-academy" },
        { platform: "youtube", href: "https://www.youtube.com/@northwind-academy" },
      ],
      // legalLinks use LinkSchema, which deliberately allows relative paths.
      legalLinks: [
        { label: "Privacy Policy", href: "/privacy", openInNewTab: false },
        { label: "Terms of Service", href: "/terms", openInNewTab: false },
      ],
      copyright: `(c) ${new Date().getFullYear()} Northwind Academy`,
    },
  });
}

(async () => {
  console.log(`[seed] realm=${REALM} base=${CMS_BASE}`);
  const categoryId = await ensureCategory();
  console.log(`[seed] category ${CAT_SLUG} -> ${categoryId}`);
  for (const c of COURSES) {
    const id = await ensureCourse(categoryId, c);
    if (id) console.log(`[seed] course ${c.code} -> ${id} (published)`);
  }
  await putNav();
  console.log("[seed] nav header authored.");
  await putFooterNav();
  console.log("[seed] nav footer authored (3 link columns).");
  await putFooterChrome();
  console.log("[seed] footer chrome authored (social + legal + copyright). Done.");
})().catch((e) => fail(e?.stack || String(e)));
