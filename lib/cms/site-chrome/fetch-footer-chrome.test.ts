// lib/cms/site-chrome/fetch-footer-chrome.test.ts
/**
 * Only the CACHE TAGS and the null-degradation are asserted here. cmsFetch's own
 * behaviour (timeout, non-OK, network error) is covered once in core.test.ts and
 * is not re-tested per reader.
 *
 * The tags earn their own test because getting them wrong is SILENT: a read tag
 * that does not match its write tag caches forever and never invalidates, with
 * no error anywhere. That is the exact defect this plan fixed in the header nav.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../env", () => ({ CMS_TENANT_REALM: "northwind" }));
vi.mock("../core/cms-fetch", () => ({ cmsFetch: vi.fn() }));

import { cmsFetch } from "../core/cms-fetch";
import { fetchFooterChrome } from "./fetch-footer-chrome";

const mockedFetch = vi.mocked(cmsFetch);

describe("fetchFooterChrome", () => {
  beforeEach(() => mockedFetch.mockReset());

  it("reads the footer chrome with the site-settings singleton and layout tags", async () => {
    mockedFetch.mockResolvedValue(null);

    await fetchFooterChrome();

    expect(mockedFetch).toHaveBeenCalledWith("/api/v1/site-chrome/footer", {
      realm: "northwind",
      tags: ["northwind:site-settings", "northwind:layout"],
    });
  });

  it("returns null (never throws) when cmsFetch degrades to null", async () => {
    mockedFetch.mockResolvedValue(null);
    expect(await fetchFooterChrome()).toBeNull();
  });

  it("normalizes a delivered envelope into flat slots", async () => {
    mockedFetch.mockResolvedValue({
      data: {
        footer: {
          data: {
            attributes: {
              copyright: "(c) 2026 Northwind",
              legalLinks: [{ label: "Privacy", href: "/privacy" }],
            },
          },
        },
      },
    });

    expect(await fetchFooterChrome()).toEqual({
      socialLinks: [],
      legalLinks: [{ label: "Privacy", href: "/privacy", openInNewTab: false }],
      copyright: "(c) 2026 Northwind",
    });
  });
});
