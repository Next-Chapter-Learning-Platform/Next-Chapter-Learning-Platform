"use client";

import Link from "next/link";
import posthog from "posthog-js";

interface StartLearningButtonProps {
  href: string | null;
  courseSlug: string;
  className?: string;
  children: React.ReactNode;
}

export function StartLearningButton({ href, courseSlug, className, children }: StartLearningButtonProps) {
  if (!href) {
    return (
      <button type="button" className={className} disabled aria-disabled="true">
        Lessons coming soon
      </button>
    );
  }

  function handleClick() {
    posthog.capture("course_started", {
      course_slug: courseSlug,
    });
  }

  return (
    <Link className={className} href={href} onClick={handleClick}>
      {children}
    </Link>
  );
}
