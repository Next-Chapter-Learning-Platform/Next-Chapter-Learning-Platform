"use client";

import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";

function usePostHogView(
  viewKey: string,
  event: string,
  properties: Record<string, string | number | boolean | undefined>,
) {
  const { isLoaded, isSignedIn, user } = useUser();
  const capturedView = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || capturedView.current === viewKey) return;

    if (isSignedIn && user) {
      posthog.identify(user.id);
    }

    posthog.capture(event, properties);
    capturedView.current = viewKey;
  }, [event, isLoaded, isSignedIn, properties, user, viewKey]);
}

export function CoursesCatalogViewed({ courseCount }: { courseCount: number }) {
  usePostHogView("courses-catalog", "courses_catalog_viewed", {
    course_count: courseCount,
  });

  return null;
}

type CourseViewedProps = {
  courseSlug: string;
  courseTitle?: string;
  courseLevel?: string;
};

export function CourseViewed({ courseSlug, courseTitle, courseLevel }: CourseViewedProps) {
  usePostHogView(`course:${courseSlug}`, "course_viewed", {
    course_slug: courseSlug,
    course_title: courseTitle,
    course_level: courseLevel,
  });

  return null;
}
