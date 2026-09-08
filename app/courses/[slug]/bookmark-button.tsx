"use client";

import { useState } from "react";
import posthog from "posthog-js";
import styles from "./page.module.css";

export function BookmarkButton({ courseSlug }: { courseSlug?: string }) {
  const [bookmarked, setBookmarked] = useState(false);

  function handleBookmark() {
    const next = !bookmarked;
    setBookmarked(next);
    posthog.capture("course_bookmarked", {
      course_slug: courseSlug,
      bookmarked: next,
    });
  }

  return (
    <button
      type="button"
      className={styles.bookmarkButton}
      aria-pressed={bookmarked}
      onClick={handleBookmark}
    >
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill={bookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 3h12v18l-6-4-6 4V3Z" />
      </svg>
      {bookmarked ? "Saved" : "Bookmark"}
    </button>
  );
}
