// lib/cms/site-chrome/normalize-footer-chrome.test.ts
import { describe, expect, it } from "vitest";

import { normalizeFooterChrome } from "./normalize-footer-chrome";

const EMPTY = { socialLinks: [], legalLinks: [], copyright: "" };

/** A fully-populated delivery envelope, matching what getFooter() serves. */
const populated = {
  data: {
    footer: {
      data: {
        id: "abc",
        attributes: {
          copyright: "© 2026 Northwind Academy",
          socialLinks: [
            { platform: "linkedin", href: "https://linkedin.com/company/nw" },
            { platform: "youtube", href: "https://youtube.com/@nw" },
          ],
          legalLinks: [
            { label: "Privacy", href: "/privacy", openInNewTab: false },
            { label: "Terms", href: "/terms", openInNewTab: true },
          ],
        },
      },
    },
  },
};

describe("normalizeFooterChrome", () => {
  // The delivery route serves the stored JSONB VERBATIM with no re-validation
  // (config-delivery.service.ts getFooter), so a half-migrated or hand-edited
  // blob reaches the storefront unchecked. Every one of these must degrade to
  // empty slots rather than throw -- a footer must never break the page.
  it("returns all-empty slots for every unusable envelope shape", () => {
    expect(normalizeFooterChrome(null)).toEqual(EMPTY);
    expect(normalizeFooterChrome(undefined)).toEqual(EMPTY);
    expect(normalizeFooterChrome({})).toEqual(EMPTY);
    expect(normalizeFooterChrome("nope")).toEqual(EMPTY);
    expect(normalizeFooterChrome({ data: { footer: { data: null } } })).toEqual(
      EMPTY,
    );
    expect(
      normalizeFooterChrome({ data: { footer: { data: { attributes: null } } } }),
    ).toEqual(EMPTY);
  });

  it("returns empty slots when the slots are present but not arrays/strings", () => {
    expect(
      normalizeFooterChrome({
        data: {
          footer: {
            data: {
              attributes: {
                socialLinks: { nope: true },
                legalLinks: "nope",
                copyright: 42,
              },
            },
          },
        },
      }),
    ).toEqual(EMPTY);
  });

  it("flattens a populated envelope into flat slots", () => {
    expect(normalizeFooterChrome(populated)).toEqual({
      copyright: "© 2026 Northwind Academy",
      socialLinks: [
        { platform: "linkedin", href: "https://linkedin.com/company/nw" },
        { platform: "youtube", href: "https://youtube.com/@nw" },
      ],
      legalLinks: [
        { label: "Privacy", href: "/privacy", openInNewTab: false },
        { label: "Terms", href: "/terms", openInNewTab: true },
      ],
    });
  });

  // Read-side half of the empty-slot contract: a half-authored entry renders as
  // a broken link (empty anchor text, or an anchor to nowhere), which is worse
  // than rendering nothing. Drop the entry, keep its siblings.
  it("drops link entries missing a required field, keeping the valid ones", () => {
    const result = normalizeFooterChrome({
      data: {
        footer: {
          data: {
            attributes: {
              socialLinks: [
                { platform: "linkedin", href: "https://linkedin.com/company/nw" },
                { platform: "twitter" }, // no href
                { href: "https://example.com" }, // no platform
                "nonsense",
              ],
              legalLinks: [
                { label: "Privacy", href: "/privacy" },
                { label: "", href: "/terms" }, // blank label
                { label: "Cookies" }, // no href
              ],
            },
          },
        },
      },
    });

    expect(result.socialLinks).toEqual([
      { platform: "linkedin", href: "https://linkedin.com/company/nw" },
    ]);
    expect(result.legalLinks).toEqual([
      { label: "Privacy", href: "/privacy", openInNewTab: false },
    ]);
  });

  // These hrefs reach `<a href={...}>` directly, and React does not sanitize
  // them. `LinkSchema` is a bare `z.string()` with no URL validation (it must
  // allow relative paths), so a `javascript:` URI survives even the VALIDATED
  // admin write path -- and the raw Strapi migration writer bypasses Zod
  // entirely. Allowlisting the scheme here is the only thing standing between a
  // CMS operator (or anyone who can write that JSONB) and stored XSS.
  it("drops hrefs whose scheme is not on the allowlist", () => {
    const result = normalizeFooterChrome({
      data: {
        footer: {
          data: {
            attributes: {
              legalLinks: [
                { label: "Safe relative", href: "/privacy" },
                { label: "Safe absolute", href: "https://example.com/terms" },
                { label: "Safe mailto", href: "mailto:legal@example.com" },
                { label: "Safe anchor", href: "#legal" },
                { label: "XSS", href: "javascript:alert(1)" },
                { label: "XSS upper", href: "JavaScript:alert(1)" },
                { label: "XSS padded", href: "  javascript:alert(1)" },
                { label: "XSS obfuscated", href: "java\tscript:alert(1)" },
                { label: "Data URI", href: "data:text/html,<script>alert(1)</script>" },
                { label: "VBScript", href: "vbscript:msgbox(1)" },
                { label: "Protocol-relative", href: "//evil.example.com" },
              ],
              socialLinks: [
                { platform: "linkedin", href: "https://linkedin.com/company/x" },
                { platform: "twitter", href: "javascript:alert(1)" },
              ],
            },
          },
        },
      },
    });

    expect(result.legalLinks.map((l) => l.label)).toEqual([
      "Safe relative",
      "Safe absolute",
      "Safe mailto",
      "Safe anchor",
    ]);
    expect(result.socialLinks.map((s) => s.platform)).toEqual(["linkedin"]);
  });

  it("defaults openInNewTab to false when the stored entry omits it", () => {
    const result = normalizeFooterChrome({
      data: {
        footer: {
          data: { attributes: { legalLinks: [{ label: "A", href: "/a" }] } },
        },
      },
    });
    expect(result.legalLinks[0].openInNewTab).toBe(false);
  });
});
