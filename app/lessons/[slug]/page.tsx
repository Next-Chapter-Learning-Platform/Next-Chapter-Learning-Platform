import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, type ReactNode } from "react";

import { getYouTubeVideoId } from "@/lib/video/youtube";
import { getLessonBySlug, getLessonSlugs } from "@/sanity/data/lessons";
import { urlFor } from "@/sanity/lib/image";

import { BookmarkButton } from "./bookmark-button";
import { LessonViewed } from "./lesson-viewed";
import { YouTubePlayer } from "./youtube-player";
import styles from "./page.module.css";

type LessonData = NonNullable<Awaited<ReturnType<typeof getLessonBySlug>>>;
type LessonCourse = NonNullable<LessonData["course"]>;
type CourseModule = LessonCourse["modules"][number];
type IconName = "arrow" | "back" | "bell" | "check" | "chevron" | "clock" | "external" | "file" | "lightbulb" | "play" | "signal" | "users";

const getLesson = cache(getLessonBySlug);

const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className={styles.notesParagraph}>{children}</p>,
    h2: ({ children }) => <h3 className={styles.notesHeading}>{children}</h3>,
    h3: ({ children }) => <h4 className={styles.notesSubheading}>{children}</h4>,
    blockquote: ({ children }) => <blockquote className={styles.notesQuote}>{children}</blockquote>,
  },
  list: {
    bullet: ({ children }) => <ul className={styles.notesList}>{children}</ul>,
    number: ({ children }) => <ol className={styles.notesList}>{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
  marks: {
    code: ({ children }) => <code className={styles.inlineCode}>{children}</code>,
    link: ({ children, value }) => {
      const href = typeof value?.href === "string" ? value.href : null;
      if (!href) return <>{children}</>;

      const openInNewTab = value?.openInNewTab === true;
      return (
        <a href={href} target={openInNewTab ? "_blank" : undefined} rel={openInNewTab ? "noopener noreferrer" : undefined}>
          {children}
        </a>
      );
    },
  },
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
    case "arrow": return <svg {...props}><path d="M5 12h14M14 6l6 6-6 6" /></svg>;
    case "back": return <svg {...props}><path d="m11 6-6 6 6 6M5 12h14" /></svg>;
    case "bell": return <svg {...props}><path d="M18 8a6 6 0 0 0-12 0c0 6.5-3 7-3 9h18c0-2-3-2.5-3-9" /><path d="M10 21h4" /></svg>;
    case "check": return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></svg>;
    case "chevron": return <svg {...props}><path d="m9 18 6-6-6-6" /></svg>;
    case "clock": return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "external": return <svg {...props}><path d="M14 5h5v5M11 13l8-8M19 13v6H5V5h6" /></svg>;
    case "file": return <svg {...props}><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5" /></svg>;
    case "lightbulb": return <svg {...props}><path d="M9 18h6M10 22h4M8.5 14.5A7 7 0 1 1 15.5 14.5C14.5 15.3 14 16.1 14 18h-4c0-1.9-.5-2.7-1.5-3.5Z" /></svg>;
    case "play": return <svg {...props} fill="currentColor" stroke="none"><path d="m9 6 9 6-9 6V6Z" /></svg>;
    case "signal": return <svg {...props}><path d="M4 20v-4M8 20v-7M12 20V9M16 20V5" /></svg>;
    case "users": return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
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
        <Link className={styles.brand} href="/" aria-label="Vertex home"><VertexMark /><span>Vertex</span></Link>
        <div className={styles.navLinks}><Link href="/courses">Courses</Link><Link href="/#my-learning">My Learning</Link></div>
        <div className={styles.accountActions}>
          <Show when="signed-out">
            <SignInButton><button type="button" className={styles.authTextButton}>Sign in</button></SignInButton>
            <SignUpButton><button type="button" className={`${styles.authTextButton} ${styles.signUpButton}`}>Sign up</button></SignUpButton>
          </Show>
          <Show when="signed-in">
            <button type="button" className={styles.notificationButton} aria-label="View notifications"><Icon name="bell" size={24} /></button>
            <UserButton appearance={{ elements: { avatarBox: styles.userAvatar } }} />
          </Show>
        </div>
      </nav>
    </header>
  );
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.round((safeSeconds % 3600) / 60);
  if (hours === 0) return `${Math.max(1, minutes)}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatLevel(level: LessonCourse["level"]) {
  const safeLevel = level ?? "beginner";
  return safeLevel.charAt(0).toUpperCase() + safeLevel.slice(1);
}

function formatStudentCount(count: number) {
  return `${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(count).toLowerCase()} students`;
}

function moduleDuration(courseModule: CourseModule) {
  return (courseModule.lessons ?? []).reduce((total, lesson) => total + (lesson.duration ?? 0), 0);
}

function MetaItem({ icon, children }: { icon: IconName; children: ReactNode }) {
  return <span><Icon name={icon} size={18} />{children}</span>;
}

function parseStartSeconds(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue || !/^\d+$/.test(rawValue)) return 0;
  const seconds = Number(rawValue);
  return Number.isSafeInteger(seconds) ? Math.min(seconds, 86_400) : 0;
}

function CourseOutlineContent({ course, lessonId }: { course: LessonCourse; lessonId: string }) {
  const coverUrl = course.coverImage?.asset
    ? urlFor(course.coverImage).width(144).height(144).fit("crop").auto("format").url()
    : null;
  const blurDataUrl = course.coverImage?.assetData?.metadata?.lqip ?? undefined;

  return (
    <>
      <Link className={styles.backLink} href={`/courses/${course.slug}`}><Icon name="back" size={18} />Back to course</Link>
      <div className={styles.courseSummary}>
        <div className={styles.courseCover}>
          {coverUrl ? (
            <Image src={coverUrl} alt="" fill sizes="52px" placeholder={blurDataUrl ? "blur" : "empty"} blurDataURL={blurDataUrl} />
          ) : <span>{course.title?.charAt(0) ?? "V"}</span>}
        </div>
        <div><strong>{course.title}</strong><span>0% complete</span><span className={styles.progress}><i /></span></div>
      </div>
      <nav className={styles.curriculum} aria-label="Course lessons">
        {course.modules.map((courseModule, moduleIndex) => {
          const isCurrentModule = moduleIndex + 1 === course.moduleNumber;
          return (
            <details className={styles.module} open={isCurrentModule} key={courseModule._key}>
              <summary>
                <span className={`${styles.moduleNumber} ${isCurrentModule ? styles.currentModuleNumber : ""}`}>{moduleIndex + 1}</span>
                <span className={styles.moduleTitle}><strong>{courseModule.title ?? "Module"}</strong><small>{formatDuration(moduleDuration(courseModule))}</small></span>
                <span className={styles.moduleChevron}><Icon name="chevron" size={16} /></span>
              </summary>
              <ol className={styles.lessonList}>
                {(courseModule.lessons ?? []).map((moduleLesson) => {
                  const isCurrentLesson = moduleLesson._id === lessonId;
                  if (!moduleLesson.slug) return null;
                  return (
                    <li className={isCurrentLesson ? styles.currentLesson : ""} key={moduleLesson._key}>
                      <span className={styles.lessonDot}>{isCurrentLesson ? <Icon name="play" size={13} /> : null}</span>
                      <Link href={`/lessons/${moduleLesson.slug}`} aria-current={isCurrentLesson ? "page" : undefined}>
                        <strong>{moduleLesson.title ?? "Untitled lesson"}</strong>
                        <small>{isCurrentLesson ? "Now playing" : formatDuration(moduleLesson.duration ?? 0)}</small>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </details>
          );
        })}
      </nav>
    </>
  );
}

function CourseOutline({ course, lessonId }: { course: LessonCourse; lessonId: string }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.desktopOutline}><CourseOutlineContent course={course} lessonId={lessonId} /></div>
      <details className={styles.mobileOutline}>
        <summary>Course outline <Icon name="chevron" size={17} /></summary>
        <CourseOutlineContent course={course} lessonId={lessonId} />
      </details>
    </aside>
  );
}

function ResourceIcon({ type }: { type: NonNullable<LessonData["resources"]>[number]["type"] }) {
  return type === "code" ? <span className={styles.codeResource}>&lt;/&gt;</span> : <Icon name="file" size={20} />;
}

export async function generateStaticParams() {
  const lessons = await getLessonSlugs();
  return lessons.flatMap(({ slug }) => (slug ? [{ slug }] : []));
}

export async function generateMetadata({ params }: PageProps<"/lessons/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lesson = await getLesson(slug);
  if (!lesson) return { title: "Lesson not found — Vertex" };
  return {
    title: `${lesson.title} — Vertex`,
    description: `Learn ${lesson.title}${lesson.course ? ` in ${lesson.course.title}` : ""}.`,
  };
}

export default async function LessonPage({ params, searchParams }: PageProps<"/lessons/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const lesson = await getLesson(slug);
  if (
    !lesson?.course ||
    !lesson.title ||
    !lesson.slug ||
    !lesson.course.title ||
    !lesson.course.slug ||
    !lesson.course.module.title
  ) notFound();

  const { course } = lesson;
  if (!course.slug) notFound();
  const startSeconds = parseStartSeconds(query.start);
  const videoId = getYouTubeVideoId(lesson.videoUrl ?? "");
  const posterUrl = lesson.thumbnail?.asset
    ? urlFor(lesson.thumbnail).width(1280).height(720).fit("crop").auto("format").url()
    : null;
  const posterAlt = lesson.thumbnail?.alt ?? lesson.title;
  const posterBlurDataUrl = lesson.thumbnail?.assetData?.metadata?.lqip ?? undefined;

  return (
    <div className={styles.viewport}>
      <LessonViewed
        lessonId={lesson._id}
        lessonSlug={lesson.slug}
        lessonTitle={lesson.title}
        courseId={course._id}
        courseSlug={course.slug}
        moduleNumber={course.moduleNumber}
        lessonNumber={course.lessonNumber}
      />
      <div className={styles.pageFrame}>
        <SiteHeader />
        <div className={styles.lessonLayout}>
          <CourseOutline course={course} lessonId={lesson._id} />
          <main className={styles.main}>
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
              <Link href="/courses">All Courses</Link><Icon name="chevron" size={15} />
              <Link href={`/courses/${course.slug}`}>{course.title}</Link><Icon name="chevron" size={15} />
              <span>{course.module.title}</span><Icon name="chevron" size={15} />
              <span aria-current="page">{lesson.title}</span>
            </nav>

            <header className={styles.lessonHeader}>
              <div>
                <p className={styles.lessonBadge}>{course.lessonLabel}</p>
                <h1>{lesson.title}</h1>
                <p className={styles.lessonSummary}>{course.module.summary}</p>
                <div className={styles.meta} aria-label="Lesson details">
                  <MetaItem icon="clock">{formatDuration(lesson.duration ?? 0)}</MetaItem>
                  <MetaItem icon="signal">{formatLevel(course.level)}</MetaItem>
                  <MetaItem icon="users">{formatStudentCount(lesson.studentCount ?? 0)}</MetaItem>
                </div>
              </div>
              <div className={styles.bookmark}><BookmarkButton lessonSlug={lesson.slug} /></div>
            </header>

            <section className={styles.videoSection} aria-label="Lesson video">
              {videoId ? (
                <YouTubePlayer
                  videoId={videoId}
                  title={lesson.title}
                  startSeconds={startSeconds}
                  posterUrl={posterUrl}
                  posterAlt={posterAlt}
                  posterBlurDataUrl={posterBlurDataUrl}
                />
              ) : (
                <div className={styles.videoUnavailable}>
                  {posterUrl && <Image src={posterUrl} alt={posterAlt} fill sizes="(max-width: 900px) calc(100vw - 40px), 900px" placeholder={posterBlurDataUrl ? "blur" : "empty"} blurDataURL={posterBlurDataUrl} />}
                  <p>This lesson video is currently unavailable.</p>
                </div>
              )}
            </section>

            <div className={styles.tabs} role="tablist" aria-label="Lesson content tabs">
              <span role="tab" aria-selected="true">Lesson Content</span>
              <span role="tab" aria-selected="false" aria-disabled="true">Notes</span>
            </div>

            <article className={styles.lessonContent}>
              <section className={styles.overview} aria-labelledby="overview-heading">
                <h2 id="overview-heading">Overview</h2>
                <div className={styles.notes}><PortableText value={lesson.notes ?? []} components={portableTextComponents} /></div>
              </section>

              <section className={styles.keyPoints} aria-labelledby="key-points-heading">
                <h2 id="key-points-heading">In this lesson you will:</h2>
                <ul>{(lesson.keyPoints ?? []).map((point) => <li key={point}><Icon name="check" size={20} /><span>{point}</span></li>)}</ul>
              </section>

              {lesson.proTip && (
                <aside className={styles.proTip}>
                  <Icon name="lightbulb" size={29} />
                  <div><h2>Pro Tip</h2><p>{lesson.proTip}</p></div>
                </aside>
              )}

              {lesson.resources && lesson.resources.length > 0 && (
                <section className={styles.resources} aria-labelledby="resources-heading">
                  <h2 id="resources-heading">Resources</h2>
                  <div className={styles.resourceGrid}>
                    {lesson.resources.map((resource) => resource.url ? (
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" key={resource._key}>
                        <span className={styles.resourceIcon}><ResourceIcon type={resource.type} /></span>
                        <span><strong>{resource.title}</strong><small>{resource.description}</small></span>
                        <Icon name="external" size={15} />
                      </a>
                    ) : null)}
                  </div>
                </section>
              )}
            </article>
          </main>
        </div>

        <footer className={styles.lessonNavigation}>
          <div className={styles.previousAction}>
            {course.previousLesson?.slug ? <Link href={`/lessons/${course.previousLesson.slug}`}><Icon name="back" size={18} />Previous Lesson</Link> : <span className={styles.disabledAction}>First lesson</span>}
          </div>
          <div className={styles.previousTitle}>
            {course.previousLesson && <><span>{course.previousLesson.title}</span><small>{formatDuration(course.previousLesson.duration ?? 0)}</small></>}
          </div>
          <div className={styles.nextTitle}>
            {course.nextLesson && <><span>{course.nextLesson.title}</span><small>{formatDuration(course.nextLesson.duration ?? 0)}</small></>}
          </div>
          <div className={styles.nextAction}>
            {course.nextLesson?.slug ? <Link href={`/lessons/${course.nextLesson.slug}`}>Next Lesson<Icon name="arrow" size={19} /></Link> : <span className={styles.disabledAction}>Course complete</span>}
          </div>
        </footer>
      </div>
    </div>
  );
}
