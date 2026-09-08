"use client";

import Link from "next/link";
import posthog from "posthog-js";

interface CourseCardLinkProps {
  href: string;
  courseSlug: string;
  courseTitle: string;
  className?: string;
  children: React.ReactNode;
}

export function CourseCardLink({ href, courseSlug, courseTitle, className, children }: CourseCardLinkProps) {
  function handleClick() {
    posthog.capture("course_card_clicked", {
      course_slug: courseSlug,
      course_title: courseTitle,
      source: "catalog",
    });
  }

  return (
    <Link className={className} href={href} onClick={handleClick}>
      {children}
    </Link>
  );
}
