"use client";

import { useState } from "react";
import styles from "./page.module.css";

export function BookmarkButton() {
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <button
      type="button"
      className={styles.bookmarkButton}
      aria-pressed={bookmarked}
      onClick={() => setBookmarked((current) => !current)}
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
