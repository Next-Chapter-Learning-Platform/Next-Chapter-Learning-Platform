"use client";

import Link from "next/link";
import posthog from "posthog-js";

interface StartLearningButtonProps {
  href: string;
  courseSlug: string;
  className?: string;
  children: React.ReactNode;
}

export function StartLearningButton({ href, courseSlug, className, children }: StartLearningButtonProps) {
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
