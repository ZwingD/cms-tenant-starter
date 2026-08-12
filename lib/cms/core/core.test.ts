import { describe, it, expect, vi, beforeEach } from "vitest";

// CMS_BASE is read at import time in env.ts; mock it so cmsFetch exercises fetch.
vi.mock("../env", () => ({
  CMS_BASE: "https://cms.test",
  CMS_TENANT_REALM: "demo",
  CMS_WEBHOOK_SECRET: "",
}));

import { listTag, detailTag, singletonTag, layoutTag } from "./tags";
import {
  cmsFetch,
  resolveTimeoutMs,
  BUILD_TIMEOUT_MS,
  REQUEST_TIMEOUT_MS,
} from "./cms-fetch";
import { toNativeSections } from "./envelope";

describe("tags", () => {
  it("matches the cms-revalidate tag shape", () => {
    expect(listTag("demo", "blog-post")).toBe("demo:blog-post:list");
    expect(detailTag("demo", "course-landing", "x")).toBe(
      "demo:course-landing:x",
    );
  });

  // Singleton content types ("navigation", "site-settings") are NOT slug-bearing:
  // computeTags.ts emits a BARE `${realm}:${type}` for them, never a `:list`
  // suffix. Subscribing a singleton read to listTag() silently breaks
  // revalidation -- the read tag never matches the write tag.
  it("builds bare singleton + layout tags for non-slug-bearing types", () => {
    expect(singletonTag("demo", "navigation")).toBe("demo:navigation");
    expect(singletonTag("demo", "site-settings")).toBe("demo:site-settings");
    expect(layoutTag("demo")).toBe("demo:layout");
  });
});

// Build time and request time have OPPOSITE requirements, and conflating them
// is what shipped footerless pages: at request time a slow CMS must never hang
// a user's page (short budget), but at build time nobody is waiting and a
// timeout bakes missing content into a static artifact that persists until
// something revalidates it. Measured CMS latency from a cold TLS handshake
// reached 2.73s against the old flat 2000ms budget.
describe("resolveTimeoutMs (build vs request budget)", () => {
  beforeEach(() => vi.unstubAllEnvs());

  it("uses the short request budget outside a production build", () => {
    vi.stubEnv("NEXT_PHASE", undefined);
    expect(resolveTimeoutMs()).toBe(REQUEST_TIMEOUT_MS);
    vi.stubEnv("NEXT_PHASE", "phase-production-server");
    expect(resolveTimeoutMs()).toBe(REQUEST_TIMEOUT_MS);
    vi.stubEnv("NEXT_PHASE", "phase-development-server");
    expect(resolveTimeoutMs()).toBe(REQUEST_TIMEOUT_MS);
  });

  it("uses the generous build budget during `next build`", () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    expect(resolveTimeoutMs()).toBe(BUILD_TIMEOUT_MS);
  });

  it("lets an explicit caller budget win in either phase", () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    expect(resolveTimeoutMs(500)).toBe(500);
    vi.stubEnv("NEXT_PHASE", undefined);
    expect(resolveTimeoutMs(500)).toBe(500);
  });

  it("gives the build budget real headroom over the request budget", () => {
    expect(BUILD_TIMEOUT_MS).toBeGreaterThanOrEqual(REQUEST_TIMEOUT_MS * 5);
  });
});

describe("cmsFetch (never throws -> null)", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns the parsed body on a 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ hi: 1 }) })),
    );
    expect(await cmsFetch("/x", { realm: "demo", tags: ["t"] })).toEqual({
      hi: 1,
    });
  });

  it("returns null on a non-OK response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    expect(await cmsFetch("/x", { realm: "demo", tags: ["t"] })).toBeNull();
  });

  it("returns null on a network error / abort (timeout)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    expect(await cmsFetch("/x", { realm: "demo", tags: ["t"] })).toBeNull();
  });

  // Degrading to null is the intended contract, but doing it SILENTLY is what
  // let a footerless page ship unnoticed. The null still happens; it is just no
  // longer invisible.
  it("warns instead of failing silently when it degrades to null", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );

    expect(await cmsFetch("/api/v1/site-chrome/footer", { realm: "demo", tags: ["t"] })).toBeNull();

    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0]?.[0] ?? "");
    expect(message).toContain("/api/v1/site-chrome/footer");
    expect(message).toContain("ECONNREFUSED");
  });

  it("names the build phase in the warning so a bad prerender is diagnosable", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503 })));

    await cmsFetch("/api/v1/navigation/footer", { realm: "demo", tags: ["t"] });

    expect(String(warn.mock.calls[0]?.[0] ?? "")).toContain("build");
    vi.unstubAllEnvs();
  });
});

describe("toNativeSections (tolerant envelope adapter)", () => {
  const hero = {
    archetype: "hero",
    variant: "default",
    media: [{ url: "https://m/1.jpg", altText: "A" }],
  };

  it("unwraps a native {sections} envelope and resolves native media", () => {
    const out = toNativeSections({ sections: [hero] });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ archetype: "hero", variant: "default" });
    expect((out[0] as { media: unknown[] }).media[0]).toEqual({
      url: "https://m/1.jpg",
      alt: "A",
    });
  });

  it("unwraps a Strapi-v4 {data:{attributes:{sections}}} envelope + v4 media", () => {
    const v4 = {
      data: {
        attributes: {
          sections: [
            {
              archetype: "inline",
              variant: "image",
              image: {
                data: { attributes: { url: "https://m/2.png", alternativeText: "B" } },
              },
            },
          ],
        },
      },
    };
    const out = toNativeSections(v4);
    expect((out[0] as { image: unknown }).image).toEqual({
      url: "https://m/2.png",
      alt: "B",
    });
  });

  it("passes an unrecognized archetype through (UnknownArchetype) without throwing", () => {
    const out = toNativeSections({
      sections: [{ archetype: "custom-block", variant: "demo" }],
    });
    expect(out[0]).toEqual({ archetype: "custom-block", variant: "demo" });
  });

  it("returns [] for an unparseable shape (never throws)", () => {
    expect(toNativeSections(null)).toEqual([]);
    expect(toNativeSections("nope")).toEqual([]);
    expect(toNativeSections({ junk: true })).toEqual([]);
  });
});
