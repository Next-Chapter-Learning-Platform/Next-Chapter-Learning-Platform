"use client";

import Link from "next/link";
import { type FormEvent } from "react";
import posthog from "posthog-js";

interface ExploreCTAProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export function ExploreCTA({ href, className, children }: ExploreCTAProps) {
  function handleClick() {
    posthog.capture("homepage_cta_clicked", {
      cta_label: "Explore Courses",
      destination: href,
    });
  }

  return (
    <Link className={className} href={href} onClick={handleClick}>
      {children}
    </Link>
  );
}

interface SearchBoxProps {
  className?: string;
  children: React.ReactNode;
}

export function SearchBox({ className, children }: SearchBoxProps) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const query = (form.elements.namedItem("q") as HTMLInputElement)?.value ?? "";
    posthog.capture("search_submitted", {
      query_length: query.length,
    });
  }

  return (
    <form className={className} role="search" onSubmit={handleSubmit}>
      {children}
    </form>
  );
}
