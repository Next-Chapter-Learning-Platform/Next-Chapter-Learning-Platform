"use client";

import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";

type LessonViewedProps = {
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  courseId: string;
  courseSlug: string;
  moduleNumber: number;
  lessonNumber: number;
};

export function LessonViewed(props: LessonViewedProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const capturedLesson = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || capturedLesson.current === props.lessonId) return;

    if (isSignedIn && user) {
      posthog.identify(user.id);
    }

    posthog.capture("lesson_viewed", {
      lesson_id: props.lessonId,
      lesson_slug: props.lessonSlug,
      lesson_title: props.lessonTitle,
      course_id: props.courseId,
      course_slug: props.courseSlug,
      module_number: props.moduleNumber,
      lesson_number: props.lessonNumber,
    });
    capturedLesson.current = props.lessonId;
  }, [isLoaded, isSignedIn, props, user]);

  return null;
}
