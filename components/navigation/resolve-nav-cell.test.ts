// components/navigation/resolve-nav-cell.test.ts
import { describe, expect, it } from "vitest";
import { resolveNavCellKey, UNKNOWN_KEY } from "./resolve-nav-cell";
import type { NavCell } from "@/lib/cms/navigation/types";

const cell = (c: Partial<NavCell>): NavCell => ({ archetype: "", ...c });

describe("resolveNavCellKey", () => {
  it("maps a dynlist cell to the CatalogList key", () => {
    expect(resolveNavCellKey(cell({ archetype: "dynlist" }))).toBe("dynlist");
  });

  it("maps inline.image / inline.card to their promo keys", () => {
    expect(
      resolveNavCellKey(cell({ archetype: "inline", variant: "image" })),
    ).toBe("inline.image");
    expect(
      resolveNavCellKey(cell({ archetype: "inline", variant: "card" })),
    ).toBe("inline.card");
  });

  it("resolves every unregistered archetype/variant to UNKNOWN_KEY", () => {
    expect(resolveNavCellKey(cell({ archetype: "collection" }))).toBe(
      UNKNOWN_KEY,
    );
    expect(resolveNavCellKey(cell({ archetype: "inline", variant: "cta" }))).toBe(
      UNKNOWN_KEY,
    );
    expect(resolveNavCellKey(cell({ archetype: "inline" }))).toBe(UNKNOWN_KEY);
    expect(resolveNavCellKey(cell({ archetype: "hero" }))).toBe(UNKNOWN_KEY);
  });
});
