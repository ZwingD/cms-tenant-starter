import { describe, it, expect, vi, beforeEach } from "vitest";

// CMS_BASE is read at import time in env.ts; mock it so cmsFetch exercises fetch.
vi.mock("../env", () => ({
  CMS_BASE: "https://cms.test",
  CMS_TENANT_REALM: "demo",
  CMS_WEBHOOK_SECRET: "",
}));

import { listTag, detailTag } from "./tags";
import { cmsFetch } from "./cms-fetch";
import { toNativeSections } from "./envelope";

describe("tags", () => {
  it("matches the cms-revalidate tag shape", () => {
    expect(listTag("demo", "blog-post")).toBe("demo:blog-post:list");
    expect(detailTag("demo", "course-landing", "x")).toBe(
      "demo:course-landing:x",
    );
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
