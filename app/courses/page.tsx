import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import type { COURSES_QUERY_RESULT } from "@/sanity.types";
import { getCourses } from "@/sanity/data/courses";
import { urlFor } from "@/sanity/lib/image";

import { CourseCardLink } from "./course-card-link";
import { CoursesCatalogViewed } from "./course-view-events";
import styles from "./page.module.css";

type Course = COURSES_QUERY_RESULT[number];
type IconName = "arrow" | "bell" | "clock" | "file" | "image" | "signal";

export const metadata: Metadata = {
  title: "All Courses — Vertex",
  description: "Explore every course available on Vertex.",
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "arrow":
      return <svg {...props}><path d="M5 12h14M14 6l6 6-6 6" /></svg>;
    case "bell":
      return <svg {...props}><path d="M18 8a6 6 0 0 0-12 0c0 6.5-3 7-3 9h18c0-2-3-2.5-3-9" /><path d="M10 21h4" /></svg>;
    case "clock":
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "file":
      return <svg {...props}><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5" /></svg>;
    case "image":
      return <svg {...props}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m5 17 4.5-4.5 3.5 3 2.5-2.5L19 17" /></svg>;
    case "signal":
      return <svg {...props}><path d="M4 20v-4M8 20v-7M12 20V9M16 20V5" /></svg>;
  }
}

function VertexMark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M2 5h36L20 37 2 5Z" fill="#f04b16" />
      <path d="M11 10h18l-9 16-9-16Z" fill="#fffdfb" />
      <path d="M15 10h10l-5 9-5-9Z" fill="#f04b16" />
    </svg>
  );
}

function SiteHeader() {
  return (
    <header className={styles.header}>
      <nav className={styles.headerInner} aria-label="Primary navigation">
        <Link className={styles.brand} href="/" aria-label="Vertex home">
          <VertexMark />
          <span>Vertex</span>
        </Link>
        <div className={styles.navLinks}>
          <Link className={styles.activeNavLink} href="/courses" aria-current="page">Courses</Link>
          <Link href="/#my-learning">My Learning</Link>
        </div>
        <div className={styles.accountActions}>
          <Show when="signed-out">
            <SignInButton>
              <button type="button" className={styles.authTextButton}>Sign in</button>
            </SignInButton>
            <SignUpButton>
              <button type="button" className={`${styles.authTextButton} ${styles.signUpButton}`}>Sign up</button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <button type="button" className={styles.notificationButton} aria-label="View notifications">
              <Icon name="bell" size={24} />
            </button>
            <UserButton appearance={{ elements: { avatarBox: styles.userAvatar } }} />
          </Show>
        </div>
      </nav>
    </header>
  );
}

function formatLevel(level: Course["level"]) {
  if (!level) return "All levels";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function formatDuration(seconds: number | null) {
  const safeSeconds = Math.max(0, Math.round(seconds ?? 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.round((safeSeconds % 3600) / 60);

  if (hours === 0) return `${Math.max(1, minutes)}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function MetaItem({ icon, children }: { icon: IconName; children: ReactNode }) {
  return <span><Icon name={icon} size={17} />{children}</span>;
}

function CourseCard({ course, index }: { course: Course; index: number }) {
  const title = course.title ?? "Untitled course";
  const slug = course.slug;
  const coverUrl = course.coverImage?.asset
    ? urlFor(course.coverImage).width(900).height(560).fit("crop").auto("format").url()
    : null;
  const blurDataUrl = course.coverImage?.assetData?.metadata?.lqip ?? undefined;

  if (!slug) return null;

  return (
    <article className={styles.courseCard}>
      <CourseCardLink className={styles.courseLink} href={`/courses/${slug}`} courseSlug={slug} courseTitle={title} aria-label={`View ${title}`}>
        <div className={styles.cover}>
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={course.coverImage?.alt ?? `${title} course cover`}
              fill
              sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 960px) 50vw, 400px"
              fetchPriority={index < 3 ? "high" : "auto"}
              placeholder={blurDataUrl ? "blur" : "empty"}
              blurDataURL={blurDataUrl}
            />
          ) : (
            <div className={styles.coverPlaceholder} role="img" aria-label={`${title} cover image unavailable`}>
              <Icon name="image" size={34} />
              <span>Cover image unavailable</span>
            </div>
          )}
          {course.popular && <span className={styles.popularBadge}>Popular</span>}
        </div>

        <div className={styles.cardBody}>
          {course.category?.title && <p className={styles.category}>{course.category.title}</p>}
          <h2>{title}</h2>
          <p className={styles.summary}>{course.summary}</p>
          <div className={styles.meta} aria-label="Course details">
            <MetaItem icon="signal">{formatLevel(course.level)}</MetaItem>
            <MetaItem icon="clock">{formatDuration(course.duration)}</MetaItem>
            <MetaItem icon="file">{course.moduleCount ?? 0} modules</MetaItem>
          </div>
          <span className={styles.cardAction}>View course <Icon name="arrow" size={19} /></span>
        </div>
      </CourseCardLink>
    </article>
  );
}

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className={styles.viewport}>
      <CoursesCatalogViewed courseCount={courses.length} />
      <div className={styles.pageFrame}>
        <SiteHeader />
        <main className={styles.main}>
          <header className={styles.intro}>
            <p>Course catalog</p>
            <h1>All Courses</h1>
            <span>Explore practical courses built to help you learn deeply and move faster.</span>
          </header>

          {courses.length > 0 ? (
            <section className={styles.courseGrid} aria-label={`${courses.length} available courses`}>
              {courses.map((course, index) => <CourseCard course={course} index={index} key={course._id} />)}
            </section>
          ) : (
            <section className={styles.emptyState}>
              <h2>No courses yet</h2>
              <p>Courses are being prepared. Please check back soon.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
