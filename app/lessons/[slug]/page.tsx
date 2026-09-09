import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, type ReactNode } from "react";

import { buildVideoEmbed } from "@/lib/video-embed";
import { getLessonBySlug, getLessonSlugs } from "@/sanity/data/lessons";
import { urlFor } from "@/sanity/lib/image";

import styles from "./page.module.css";

type Lesson = NonNullable<Awaited<ReturnType<typeof getLessonBySlug>>>;
type LessonCourse = NonNullable<Lesson["course"]>;
type UiIconName = "arrow" | "bell" | "check" | "chevron" | "clock" | "file" | "play" | "users";

const getLesson = cache(getLessonBySlug);

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
      return <svg {...props}><path d="M19 12H5M10 6l-6 6 6 6" /></svg>;
    case "bell":
      return <svg {...props}><path d="M18 8a6 6 0 0 0-12 0c0 6.5-3 7-3 9h18c0-2-3-2.5-3-9" /><path d="M10 21h4" /></svg>;
    case "check":
      return <svg {...props}><path d="M20 6 9 17l-5-5" /></svg>;
    case "chevron":
      return <svg {...props}><path d="m7 9 5 5 5-5" /></svg>;
    case "clock":
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "file":
      return <svg {...props}><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5" /></svg>;
    case "play":
      return <svg {...props}><path d="m8 5 11 7-11 7z" /></svg>;
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

function formatClipDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function formatStudentCount(count: number | null) {
  if (!count) return "New";
  return `${new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(count).toLowerCase()} students`;
}

const notesComponents: PortableTextComponents = {
  marks: {
    code: ({ children }) => <code>{children}</code>,
    link: ({ children, value }) => {
      const href = typeof value?.href === "string" ? value.href : "#";
      const openInNewTab = value?.openInNewTab === true;
      return (
        <a
          href={href}
          {...(openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {children}
        </a>
      );
    },
  },
};

export async function generateStaticParams() {
  const lessons = await getLessonSlugs();
  return lessons.flatMap(({ slug }) => (slug ? [{ slug }] : []));
}

export async function generateMetadata({ params }: PageProps<"/lessons/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lesson = await getLesson(slug);

  if (!lesson) return { title: "Lesson not found — Vertex" };

  return {
    title: `${lesson.title ?? "Lesson"} — Vertex`,
    description: lesson.proTip ?? `Watch ${lesson.title ?? "this lesson"} on Vertex.`,
  };
}

export default async function LessonPage({ params, searchParams }: PageProps<"/lessons/[slug]">) {
  const [{ slug }, { start }] = await Promise.all([params, searchParams]);
  const lesson = await getLesson(slug);
  if (!lesson) notFound();

  const startSeconds = Number(Array.isArray(start) ? start[0] : start);
  const title = lesson.title ?? "Untitled lesson";
  const course = lesson.course;
  const embed = buildVideoEmbed(lesson.videoUrl, startSeconds);
  const keyPoints = lesson.keyPoints ?? [];
  const resources = lesson.resources ?? [];

  const posterUrl = lesson.thumbnail?.asset
    ? urlFor(lesson.thumbnail).width(1280).height(720).fit("crop").auto("format").url()
    : null;

  return (
    <div className={styles.viewport}>
      <div className={styles.pageFrame}>
        <SiteHeader />

        <main className={styles.main}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <Link href="/courses">All Courses</Link>
            <UiIcon name="chevron" size={17} />
            {course?.slug ? (
              <Link href={`/courses/${course.slug}`}>{course.title ?? "Course"}</Link>
            ) : (
              <span>Course</span>
            )}
            <UiIcon name="chevron" size={17} />
            <span aria-current="page">{title}</span>
          </nav>

          <div className={styles.layout}>
            <article className={styles.content}>
              <div className={styles.player}>
                {embed ? (
                  <iframe
                    className={styles.playerFrame}
                    src={embed.src}
                    title={embed.title}
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                    allowFullScreen
                  />
                ) : posterUrl ? (
                  <>
                    <Image
                      src={posterUrl}
                      alt={lesson.thumbnail?.alt ?? `${title} poster`}
                      fill
                      sizes="(max-width: 960px) 100vw, 760px"
                      className={styles.playerPoster}
                    />
                    <p className={styles.playerNotice}>Video unavailable</p>
                  </>
                ) : (
                  <p className={styles.playerNotice}>Video unavailable</p>
                )}
              </div>

              <div className={styles.lessonHead}>
                {course?.lessonLabel && <p className={styles.lessonLabel}>{course.lessonLabel}</p>}
                <h1>{title}</h1>
                <div className={styles.meta} aria-label="Lesson details">
                  <MetaItem icon="clock">{formatClipDuration(lesson.duration ?? 0)}</MetaItem>
                  <MetaItem icon="users">{formatStudentCount(lesson.studentCount)}</MetaItem>
                  {lesson.freePreview && <span className={styles.previewBadge}>Free preview</span>}
                </div>
              </div>

              {keyPoints.length > 0 && (
                <section className={styles.panel} aria-labelledby="keypoints-heading">
                  <h2 id="keypoints-heading">In this lesson you will</h2>
                  <ul className={styles.keyPoints}>
                    {keyPoints.map((point) => (
                      <li key={point}>
                        <span className={styles.keyPointIcon}><UiIcon name="check" size={16} /></span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {lesson.notes && lesson.notes.length > 0 && (
                <section className={styles.panel} aria-labelledby="notes-heading">
                  <h2 id="notes-heading">Lesson notes</h2>
                  <div className={styles.notes}>
                    <PortableText value={lesson.notes} components={notesComponents} />
                  </div>
                </section>
              )}

              {lesson.proTip && (
                <aside className={styles.proTip}>
                  <p className={styles.proTipLabel}>Pro tip</p>
                  <p>{lesson.proTip}</p>
                </aside>
              )}

              {resources.length > 0 && (
                <section className={styles.panel} aria-labelledby="resources-heading">
                  <h2 id="resources-heading">Resources</h2>
                  <ul className={styles.resources}>
                    {resources.map((resource) => (
                      <li key={resource._key}>
                        <a href={resource.url ?? "#"} target="_blank" rel="noopener noreferrer">
                          <span className={styles.resourceIcon}><UiIcon name="file" size={18} /></span>
                          <span className={styles.resourceCopy}>
                            <strong>{resource.title}</strong>
                            <span>{resource.description}</span>
                          </span>
                          {resource.type && <span className={styles.resourceType}>{resource.type}</span>}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </article>

            {course && <LessonSidebar course={course} currentLessonId={lesson._id} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function LessonSidebar({ course, currentLessonId }: { course: LessonCourse; currentLessonId: string }) {
  const moduleLessons = course.module?.lessons ?? [];
  const instructorPhotoUrl = course.instructor?.photo?.asset
    ? urlFor(course.instructor.photo).width(120).height(120).fit("crop").auto("format").url()
    : null;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarCard}>
        <p className={styles.sidebarEyebrow}>{course.module?.title ?? "Course content"}</p>
        <ol className={styles.sidebarLessons}>
          {moduleLessons.map((moduleLesson, index) => {
            const isCurrent = moduleLesson._id === currentLessonId;
            const label = `Lesson ${course.moduleNumber}.${index + 1}`;
            const inner = (
              <>
                <span className={styles.sidebarLessonIcon}>
                  <UiIcon name={isCurrent ? "play" : "chevron"} size={15} />
                </span>
                <span className={styles.sidebarLessonCopy}>
                  <span>{label}</span>
                  <strong>{moduleLesson.title}</strong>
                </span>
                <time>{formatClipDuration(moduleLesson.duration ?? 0)}</time>
              </>
            );
            return (
              <li key={moduleLesson._key} data-current={isCurrent || undefined}>
                {moduleLesson.slug && !isCurrent ? (
                  <Link href={`/lessons/${moduleLesson.slug}`}>{inner}</Link>
                ) : (
                  <span aria-current={isCurrent ? "true" : undefined}>{inner}</span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {course.instructor && (
        <div className={styles.sidebarCard}>
          <p className={styles.sidebarEyebrow}>Your instructor</p>
          <div className={styles.instructor}>
            <div className={styles.instructorPhoto}>
              {instructorPhotoUrl ? (
                <Image
                  src={instructorPhotoUrl}
                  alt={course.instructor.photo?.alt ?? `${course.instructor.name ?? "Instructor"} portrait`}
                  fill
                  sizes="52px"
                />
              ) : (
                <span aria-hidden="true">{course.instructor.name?.charAt(0) ?? "V"}</span>
              )}
            </div>
            <div>
              <strong className={styles.instructorName}>{course.instructor.name}</strong>
              <p>{(course.instructor.expertise ?? []).join(" · ")}</p>
            </div>
          </div>
        </div>
      )}

      {course.slug && (
        <Link className={styles.backToCourse} href={`/courses/${course.slug}`}>
          <UiIcon name="arrow" size={18} /> Back to course
        </Link>
      )}
    </aside>
  );
}
