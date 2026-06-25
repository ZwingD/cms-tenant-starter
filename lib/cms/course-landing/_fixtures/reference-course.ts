// lib/cms/course-landing/_fixtures/reference-course.ts
/**
 * Committed reference course page for the genericization demo storefront - a
 * synthetic, visibly non-Techademy tenant ("Meridian Institute"). Typed against
 * CourseLandingView so it stays honest to the archetype contract (the drift
 * gate). In P3 this fixture is what `/courses/[code]` renders (live archetype
 * delivery is P4); it exercises 4 object archetypes + an inline quote + one
 * forward-compat UnknownArchetype (`custom-block`) for the graceful-degrade path.
 *
 * Introduced: genericization P3.
 */
import type { CourseLandingView } from "../types";

export const REFERENCE_COURSE_CODE = "value-investing-101";

export const referenceCourse: CourseLandingView = {
  code: REFERENCE_COURSE_CODE,
  sections: [
    {
      archetype: "hero",
      variant: "default",
      header: {
        eyebrow: "Meridian Institute",
        heading: "Value Investing 101",
        subheading: "Read a balance sheet like a business owner, not a ticker.",
      },
      ctas: [
        { label: "Enroll now", href: "/enroll", action: "link", variant: "primary" },
        { label: "Download syllabus", href: "/syllabus.pdf", action: "download" },
      ],
      stats: [{ value: "8 weeks", label: "Cohort length" }],
      badges: [{ label: "CFA-aligned" }],
      meta: { _provenance: "legacy:ct-1-banner" },
    },
    {
      archetype: "collection",
      variant: "features",
      header: { heading: "What you'll learn" },
      items: [
        { title: "Owner earnings", body: "Cash the business actually throws off." },
        { title: "Margin of safety", body: "Price vs. intrinsic value, quantified." },
        { title: "Moats", body: "Why some advantages compound for decades." },
      ],
    },
    {
      archetype: "people",
      variant: "team",
      header: { heading: "Your instructors" },
      people: [
        { name: "Asha Rao", designation: "Portfolio Manager, 14y" },
        { name: "Daniel Okafor", designation: "Former equity analyst" },
      ],
    },
    {
      archetype: "statband",
      variant: "default",
      header: { heading: "Outcomes" },
      stats: [
        { value: "3,200+", label: "Alumni" },
        { value: "4.8/5", label: "Avg rating" },
        { value: "92%", label: "Completion" },
      ],
    },
    {
      archetype: "inline",
      variant: "quote",
      body: "The stock market is a device for transferring money from the impatient to the patient.",
      author: "Warren Buffett",
    },
    // Forward-compat: an archetype the storefront doesn't know yet (a future P4/P7
    // addition). Must render the UnknownSection placeholder, never crash (TS-002).
    { archetype: "custom-block", variant: "demo" },
  ],
};
