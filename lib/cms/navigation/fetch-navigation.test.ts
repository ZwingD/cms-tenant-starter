// lib/cms/navigation/fetch-navigation.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../env", () => ({ CMS_TENANT_REALM: "northwind" }));
vi.mock("../core/cms-fetch", () => ({ cmsFetch: vi.fn() }));

import { cmsFetch } from "../core/cms-fetch";
import { fetchNavigation } from "./fetch-navigation";

const mockedFetch = vi.mocked(cmsFetch);

describe("fetchNavigation", () => {
  beforeEach(() => mockedFetch.mockReset());

  it("fetches the location's nav with the realm + a navigation list tag, and passes the result through", async () => {
    const nav = { location: "HEADER", items: [] };
    mockedFetch.mockResolvedValue(nav);

    const result = await fetchNavigation("header");

    expect(mockedFetch).toHaveBeenCalledWith("/api/v1/navigation/header", {
      realm: "northwind",
      tags: ["northwind:navigation:list"],
    });
    expect(result).toBe(nav);
  });

  it("defaults the location to 'header'", async () => {
    mockedFetch.mockResolvedValue({ location: "HEADER", items: [] });
    await fetchNavigation();
    expect(mockedFetch).toHaveBeenCalledWith(
      "/api/v1/navigation/header",
      expect.anything(),
    );
  });

  it("returns null (never throws) when cmsFetch degrades to null", async () => {
    mockedFetch.mockResolvedValue(null);
    expect(await fetchNavigation("header")).toBeNull();
  });
});
