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
async function api(method, path, body) {
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
    id = (await api("POST", "/api/admin/course-landings", body)).id;
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

(async () => {
  console.log(`[seed] realm=${REALM} base=${CMS_BASE}`);
  const categoryId = await ensureCategory();
  console.log(`[seed] category ${CAT_SLUG} -> ${categoryId}`);
  for (const c of COURSES) {
    const id = await ensureCourse(categoryId, c);
    console.log(`[seed] course ${c.code} -> ${id} (published)`);
  }
  await putNav();
  console.log("[seed] nav header authored. Done.");
})().catch((e) => fail(e?.stack || String(e)));
