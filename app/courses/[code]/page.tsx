// app/courses/[code]/page.tsx
/**
 * Reference course-landing page: fetch the landing by code and render its
 * generic archetype sections through the renderer registry. P3 uses the
 * committed fixture as the fallback (live archetype delivery is P4); the same
 * code path goes live unchanged once P4 serves archetype payloads.
 */
import { SectionList } from "@/components/sections/registry";
import { fetchCourseLanding } from "@/lib/cms/course-landing/fetch-course-landing";
import { referenceCourse } from "@/lib/cms/course-landing/_fixtures/reference-course";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const view = await fetchCourseLanding(code, { fallback: referenceCourse });
  return <SectionList sections={view.sections} />;
}
