"use client";

import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";

export function PostHogIdentity() {
  const { isLoaded, isSignedIn, user } = useUser();
  const identifiedUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      if (identifiedUserId.current === user.id) return;

      if (identifiedUserId.current) {
        posthog.reset();
      }

      posthog.identify(user.id);
      identifiedUserId.current = user.id;
      return;
    }

    if (identifiedUserId.current) {
      posthog.reset();
    }

    identifiedUserId.current = null;
  }, [isLoaded, isSignedIn, user]);

  return null;
}
