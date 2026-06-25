import { describe, it, expect } from "vitest";
import { resolveRendererKey, UNKNOWN_KEY } from "./resolve";
import type { Section } from "@/lib/cms/course-landing/types";

describe("resolveRendererKey (crash-proof key resolution)", () => {
  it("resolves object archetypes on `archetype`", () => {
    expect(
      resolveRendererKey({ archetype: "hero", variant: "default" } as Section),
    ).toBe("hero");
    expect(
      resolveRendererKey({ archetype: "statband", variant: "x" } as Section),
    ).toBe("statband");
  });

  it("resolves inline on `inline.<variant>`", () => {
    expect(
      resolveRendererKey({
        archetype: "inline",
        variant: "quote",
        body: "q",
      } as Section),
    ).toBe("inline.quote");
  });

  it("returns the UNKNOWN sentinel for an unregistered OBJECT archetype", () => {
    expect(
      resolveRendererKey({ archetype: "custom-block", variant: "demo" }),
    ).toBe(UNKNOWN_KEY);
  });

  it("returns the UNKNOWN sentinel for an unregistered inline variant", () => {
    expect(
      resolveRendererKey({ archetype: "inline", variant: "weird" } as Section),
    ).toBe(UNKNOWN_KEY);
  });
});
