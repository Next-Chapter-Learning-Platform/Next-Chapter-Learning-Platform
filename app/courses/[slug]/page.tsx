import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, type ReactNode } from "react";

import type { COURSE_BY_SLUG_QUERY_RESULT } from "@/sanity.types";
import { getCourseBySlug, getCourseSlugs } from "@/sanity/data/courses";
import { urlFor } from "@/sanity/lib/image";

import { CourseViewed } from "../course-view-events";
import { BookmarkButton } from "./bookmark-button";
import { StartLearningButton } from "./start-learning-button";
import styles from "./page.module.css";

type Course = NonNullable<COURSE_BY_SLUG_QUERY_RESULT>;
type CourseModule = NonNullable<Course["modules"]>[number];
type OutcomeIconName = NonNullable<NonNullable<Course["learningOutcomes"]>[number]["icon"]>;
type UiIconName = "arrow" | "bell" | "chevron" | "clock" | "file" | "signal" | "users";

const getCourse = cache(getCourseBySlug);

function UiIcon({ name, size = 20 }: { name: UiIconName; size?: number }) {
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
    case "chevron":
      return <svg {...props}><path d="m7 9 5 5 5-5" /></svg>;
    case "clock":
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "file":
      return <svg {...props}><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5" /></svg>;
    case "signal":
      return <svg {...props}><path d="M4 20v-4M8 20v-7M12 20V9M16 20V5" /></svg>;
    case "users":
      return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
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

function OutcomeIcon({ name }: { name: OutcomeIconName | null }) {
  const props = {
    viewBox: "0 0 48 48",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "layers":
      return <svg {...props}><path d="m24 5 18 10-18 10L6 15 24 5Z" /><path d="m6 24 18 10 18-10M6 33l18 10 18-10" /></svg>;
    case "gauge":
      return <svg {...props}><path d="M8 38a18 18 0 1 1 32 0" /><path d="m24 24 9-9M24 9v4M11 24h4M37 24h-4" /><circle cx="24" cy="24" r="2.5" /></svg>;
    case "workflow":
      return <svg {...props}><rect x="5" y="6" width="13" height="10" rx="2" /><rect x="30" y="32" width="13" height="10" rx="2" /><path d="M18 11h6a8 8 0 0 1 8 8v13M30 37h-6a8 8 0 0 1-8-8V16" /></svg>;
    case "rocket":
      return <svg {...props}><path d="M29 8c6-4 11-3 11-3s1 5-3 11L24 29l-8-8L29 8Z" /><path d="m18 19-8 1-5 5 12 2M26 27l-1 8-5 5-2-12" /><circle cx="31" cy="14" r="3" /><path d="M10 33c-3 1-5 4-5 8 4 0 7-2 8-5" /></svg>;
    case "code":
      return <svg {...props}><path d="m16 13-10 11 10 11M32 13l10 11-10 11M28 7l-8 34" /></svg>;
    case "puzzle":
      return <svg {...props}><path d="M21 7a4 4 0 1 1 6 3.5V17h7.5A4 4 0 1 1 38 23v10H28a4 4 0 1 1-8 0H10V23a4 4 0 1 1 3.5-6H20v-6.5A4 4 0 0 1 21 7Z" /></svg>;
    case "shield":
      return <svg {...props}><path d="M24 4 40 10v11c0 11-6.5 18-16 23C14.5 39 8 32 8 21V10l16-6Z" /><path d="m17 24 5 5 10-11" /></svg>;
    case "sparkles":
    default:
      return <svg {...props}><path d="m24 5 2.5 8.5L35 16l-8.5 2.5L24 27l-2.5-8.5L13 16l8.5-2.5L24 5ZM38 27l1.5 5.5L45 34l-5.5 1.5L38 41l-1.5-5.5L31 34l5.5-1.5L38 27ZM10 27l1.2 4.3 4.3 1.2-4.3 1.2L10 38l-1.2-4.3-4.3-1.2 4.3-1.2L10 27Z" /></svg>;
  }
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.round((safeSeconds % 3600) / 60);

  if (hours === 0) return `${Math.max(1, minutes)}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatLevel(level: Course["level"]) {
  if (!level) return "All levels";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function formatStudentCount(count: number | null) {
  if (!count) return "New";
  return `${new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(count).toLowerCase()} students`;
}

function moduleDuration(courseModule: CourseModule) {
  return (courseModule.lessons ?? []).reduce(
    (total, lesson) => total + (lesson.duration ?? 0),
    0,
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
          <Link href="/courses">Courses</Link>
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
              <UiIcon name="bell" size={24} />
            </button>
            <UserButton appearance={{ elements: { avatarBox: styles.userAvatar } }} />
          </Show>
        </div>
      </nav>
    </header>
  );
}

function MetaItem({ icon, children }: { icon: UiIconName; children: ReactNode }) {
  return <span><UiIcon name={icon} size={18} />{children}</span>;
}

export async function generateStaticParams() {
  const courses = await getCourseSlugs();
  return courses.flatMap(({ slug }) => (slug ? [{ slug }] : []));
}

export async function generateMetadata({ params }: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);

  if (!course) return { title: "Course not found — Vertex" };

  return {
    title: `${course.title ?? "Course"} — Vertex`,
    description: course.summary ?? "Learn with Vertex.",
  };
}

export default async function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  const title = course.title ?? "Untitled course";
  const modules = course.modules ?? [];
  const lessons = modules.flatMap((courseModule) => courseModule.lessons ?? []);
  const totalDuration = lessons.reduce((total, lesson) => total + (lesson.duration ?? 0), 0);
  const firstLesson = lessons.find((lesson) => lesson.slug);
  const primaryHref = firstLesson?.slug ? `/lessons/${firstLesson.slug}` : "#course-content";
  const coverUrl = course.coverImage?.asset
    ? urlFor(course.coverImage).width(720).height(840).fit("crop").auto("format").url()
    : null;
  const coverBlurDataUrl = course.coverImage?.assetData?.metadata?.lqip ?? undefined;
  const instructorPhotoUrl = course.instructor?.photo?.asset
    ? urlFor(course.instructor.photo).width(180).height(180).fit("crop").auto("format").url()
    : null;
  const instructorBlurDataUrl = course.instructor?.photo?.assetData?.metadata?.lqip ?? undefined;

  return (
    <div className={styles.viewport}>
      <CourseViewed
        courseSlug={slug}
        courseTitle={course.title ?? undefined}
        courseLevel={course.level ?? undefined}
      />
      <div className={styles.pageFrame}>
        <SiteHeader />

        <main>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <Link href="/courses">All Courses</Link>
            <UiIcon name="chevron" size={17} />
            <span aria-current="page">{title}</span>
          </nav>

          <section className={styles.hero} aria-labelledby="course-heading">
            <div className={styles.cover}>
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={course.coverImage?.alt ?? `${title} course cover`}
                  fill
                  sizes="(max-width: 640px) calc(100vw - 40px), 281px"
                  fetchPriority="high"
                  placeholder={coverBlurDataUrl ? "blur" : "empty"}
                  blurDataURL={coverBlurDataUrl}
                />
              ) : (
                <div className={styles.coverFallback} aria-label={`${title} course cover`}>
                  <span>{title.charAt(0)}</span>
                </div>
              )}
            </div>

            <div className={styles.heroContent}>
              {course.popular && <p className={styles.popularBadge}>Popular</p>}
              <h1 id="course-heading">{title}</h1>
              <p className={styles.summary}>{course.summary}</p>
              <div className={styles.meta} aria-label="Course details">
                <MetaItem icon="signal">{formatLevel(course.level)}</MetaItem>
                <MetaItem icon="clock">{formatDuration(totalDuration)}</MetaItem>
                <MetaItem icon="file">{modules.length} modules</MetaItem>
                <MetaItem icon="users">{formatStudentCount(course.studentCount)}</MetaItem>
              </div>
              <div className={styles.heroActions}>
                <StartLearningButton className={styles.primaryButton} href={primaryHref} courseSlug={slug}>
                  Start Learning <UiIcon name="arrow" size={22} />
                </StartLearningButton>
                <BookmarkButton courseSlug={slug} />
              </div>
            </div>
          </section>

          <section className={styles.outcomes} aria-labelledby="outcomes-heading">
            <h2 id="outcomes-heading">What you’ll learn</h2>
            <div className={styles.outcomeGrid}>
              {(course.learningOutcomes ?? []).map((outcome) => (
                <article className={styles.outcomeCard} key={outcome._key}>
                  <div className={styles.outcomeIcon}><OutcomeIcon name={outcome.icon} /></div>
                  <div>
                    <h3>{outcome.title}</h3>
                    <p>{outcome.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.curriculum} id="course-content" aria-labelledby="curriculum-heading">
            <div className={styles.curriculumHeader}>
              <h2 id="curriculum-heading">Course Content</h2>
              <p>{modules.length} modules <span aria-hidden="true">•</span> {formatDuration(totalDuration)}</p>
            </div>
            <div className={styles.moduleList}>
              {modules.map((courseModule, moduleIndex) => (
                <details className={styles.module} key={courseModule._key}>
                  <summary>
                    <span className={styles.moduleNumber}>{moduleIndex + 1}</span>
                    <span className={styles.moduleCopy}>
                      <strong>{courseModule.title}</strong>
                      <span>{courseModule.summary}</span>
                    </span>
                    <span className={styles.moduleDuration}>{formatDuration(moduleDuration(courseModule))}</span>
                    <span className={styles.moduleChevron}><UiIcon name="chevron" size={19} /></span>
                  </summary>
                  <ol className={styles.lessonList}>
                    {(courseModule.lessons ?? []).map((lesson, lessonIndex) => (
                      <li key={lesson._key}>
                        {lesson.slug ? (
                          <Link href={`/lessons/${lesson.slug}`}>
                            <span>Lesson {moduleIndex + 1}.{lessonIndex + 1}</span>
                            <strong>{lesson.title}</strong>
                            <time>{formatDuration(lesson.duration ?? 0)}</time>
                          </Link>
                        ) : (
                          <span className={styles.missingLesson}>Lesson unavailable</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </details>
              ))}
            </div>
          </section>

          {course.instructor && (
            <section className={styles.instructor} aria-labelledby="instructor-heading">
              <div className={styles.instructorPhoto}>
                {instructorPhotoUrl ? (
                  <Image
                    src={instructorPhotoUrl}
                    alt={course.instructor.photo?.alt ?? `${course.instructor.name ?? "Course instructor"} portrait`}
                    fill
                    sizes="76px"
                    placeholder={instructorBlurDataUrl ? "blur" : "empty"}
                    blurDataURL={instructorBlurDataUrl}
                  />
                ) : (
                  <span aria-hidden="true">{course.instructor.name?.charAt(0) ?? "V"}</span>
                )}
              </div>
              <div>
                <p className={styles.instructorEyebrow}>Your instructor</p>
                <h2 id="instructor-heading">{course.instructor.name}</h2>
                <p>{(course.instructor.expertise ?? []).join(" · ")}</p>
              </div>
            </section>
          )}
        </main>

        <div className={styles.progressDock}>
          <div>
            <span>Your Progress</span>
            <strong>0% complete</strong>
          </div>
          <div className={styles.progressTrack} aria-label="Course progress: 0%" role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={100}>
            <span />
          </div>
          <StartLearningButton className={styles.progressButton} href={primaryHref} courseSlug={slug}>
            Start Learning <UiIcon name="arrow" size={22} />
          </StartLearningButton>
        </div>

        <div className={styles.skyline} aria-hidden="true">
          {[62, 92, 126, 74, 52, 96, 141, 67, 112, 148, 84, 118].map((height, index) => (
            <span key={`${height}-${index}`} style={{ height }} />
          ))}
        </div>
      </div>
    </div>
  );
}
