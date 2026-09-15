"use client";

import posthog from "posthog-js";
import { useState } from "react";

export function BookmarkButton({ lessonSlug }: { lessonSlug: string }) {
  const [bookmarked, setBookmarked] = useState(false);

  function toggleBookmark() {
    const nextValue = !bookmarked;
    setBookmarked(nextValue);
    posthog.capture("lesson_bookmark_toggled", {
      lesson_slug: lessonSlug,
      bookmarked: nextValue,
    });
  }

  return (
    <button
      type="button"
      className="lesson-bookmark-button"
      aria-label={bookmarked ? "Remove lesson bookmark" : "Bookmark lesson"}
      aria-pressed={bookmarked}
      onClick={toggleBookmark}
    >
      <svg viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} aria-hidden="true">
        <path d="M6.5 4.5A1.5 1.5 0 0 1 8 3h8a1.5 1.5 0 0 1 1.5 1.5V21L12 17.5 6.5 21V4.5Z" />
      </svg>
    </button>
  );
}
