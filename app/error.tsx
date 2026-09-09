"use client";

import Link from "next/link";
import { useEffect } from "react";
import posthog from "posthog-js";

import styles from "./error.module.css";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    <div className={styles.viewport} role="alert">
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Something went wrong</p>
        <h1>We couldn’t load this page</h1>
        <p className={styles.body}>
          The content service did not respond in time. This is usually temporary.
          Please try again.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.retry} onClick={reset}>
            Try again
          </button>
          <Link className={styles.secondary} href="/courses">
            Back to courses
          </Link>
        </div>
      </div>
    </div>
  );
}
