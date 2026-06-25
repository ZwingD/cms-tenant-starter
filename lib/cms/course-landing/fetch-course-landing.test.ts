import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../env", () => ({
  CMS_TENANT_REALM: "demo",
  CMS_BASE: "https://cms.test",
  CMS_WEBHOOK_SECRET: "",
}));
vi.mock("../core/cms-fetch", () => ({ cmsFetch: vi.fn() }));

import { cmsFetch } from "../core/cms-fetch";
import { fetchCourseLanding } from "./fetch-course-landing";
import { referenceCourse, REFERENCE_COURSE_CODE } from "./_fixtures/reference-course";

const mockFetch = vi.mocked(cmsFetch);

describe("fetchCourseLanding (live -> archetype, else fixture fallback)", () => {
  beforeEach(() => mockFetch.mockReset());

  it("falls back to the fixture when the CMS returns null", async () => {
    mockFetch.mockResolvedValue(null);
    expect(
      await fetchCourseLanding("x", { fallback: referenceCourse }),
    ).toBe(referenceCourse);
  });

  it("falls back to the fixture for a LEGACY (non-archetype) delivery shape", async () => {
    // Legacy course-landing: sections carry `type:`, not `archetype:` (P3 reality).
    mockFetch.mockResolvedValue({
      sections: [{ type: "ct-1-banner", heading: "Legacy" }],
    });
    expect(
      await fetchCourseLanding("x", { fallback: referenceCourse }),
    ).toBe(referenceCourse);
  });

  it("uses live sections when the delivery body is archetype-shaped", async () => {
    mockFetch.mockResolvedValue({
      sections: [{ archetype: "hero", variant: "live", header: { heading: "Live" } }],
    });
    const out = await fetchCourseLanding("abc", { fallback: referenceCourse });
    expect(out.code).toBe("abc");
    expect(out.sections[0]).toMatchObject({ archetype: "hero", variant: "live" });
  });
});

describe("reference fixture (drift gate + scenario coverage)", () => {
  it("exercises >=4 object archetypes + inline.quote + the custom-block unknown", () => {
    const kinds = referenceCourse.sections.map(
      (s) => `${s.archetype}${"variant" in s ? "." + s.variant : ""}`,
    );
    expect(kinds).toEqual(
      expect.arrayContaining([
        "hero.default",
        "collection.features",
        "people.team",
        "statband.default",
        "inline.quote",
        "custom-block.demo",
      ]),
    );
    // Hero exercises badges + the meta passthrough.
    const hero = referenceCourse.sections[0];
    expect(hero.archetype).toBe("hero");
    expect(REFERENCE_COURSE_CODE).toBe("value-investing-101");
  });
});
