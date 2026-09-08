import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

import type { HOMEPAGE_COURSES_QUERY_RESULT } from "@/sanity.types";
import { getHomepageCourses } from "@/sanity/data/courses";
import { urlFor } from "@/sanity/lib/image";

import { ExploreCTA, SearchBox } from "./homepage-interactions";
import styles from "./page.module.css";

type IconName = "arrow" | "bell" | "clock" | "file" | "search" | "signal" | "star";

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
    case "search":
      return <svg {...props}><circle cx="10.5" cy="10.5" r="7.5" /><path d="m16 16 5 5" /></svg>;
    case "signal":
      return <svg {...props}><path d="M4 20v-4M8 20v-7M12 20V9M16 20V5" /></svg>;
    case "star":
      return <svg {...props}><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg>;
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

type HomepageCourse = HOMEPAGE_COURSES_QUERY_RESULT[number];

function formatLevel(level: HomepageCourse["level"]) {
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

function courseAbbreviation(title: string) {
  const words = title.match(/[A-Za-z0-9]+/g) ?? [];
  if (words.length === 0) return "V";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  const firstInitial = words[0]?.charAt(0) || "V";
  const secondInitial = words[1]?.charAt(0) || "";
  return `${firstInitial}${secondInitial}`.toUpperCase();
}

function CourseMark({ course, title }: { course: HomepageCourse; title: string }) {
  const imageUrl = course.coverImage?.asset
    ? urlFor(course.coverImage).width(180).height(180).fit("crop").auto("format").url()
    : null;

  return (
    <div className={styles.courseMark} aria-hidden="true">
      {imageUrl ? (
        <Image src={imageUrl} alt="" fill sizes="74px" />
      ) : (
        <span>{courseAbbreviation(title)}</span>
      )}
    </div>
  );
}

function CourseCard({ course }: { course: HomepageCourse }) {
  const title = course.title ?? "Untitled course";
  const slug = course.slug;
  const moduleCount = course.moduleCount ?? 0;

  if (!slug) return null;

  return (
    <article className={styles.courseCard}>
      <Link className={styles.courseCardLink} href={`/courses/${slug}`} aria-label={`View ${title}`}>
        <CourseMark course={course} title={title} />
        <h3>{title}</h3>
        <p className={styles.courseCardCopy}>{course.summary}</p>
        <div className={styles.courseMeta}>
          <span><Icon name="signal" size={16} />{formatLevel(course.level)}</span>
          <span><Icon name="clock" size={16} />{formatDuration(course.duration)}</span>
          <span><Icon name="file" size={16} />{moduleCount} {moduleCount === 1 ? "module" : "modules"}</span>
        </div>
      </Link>
    </article>
  );
}

const skylineHeights = [88, 120, 160, 195, 142, 126, 80, 46, 75, 108, 145, 193, 126, 84, 148, 175];

export default async function Home() {
  const courses = await getHomepageCourses();

  return (
    <div className={styles.viewport}>
      <div className={styles.pageFrame}>
        <header className={styles.header}>
          <nav className={styles.headerInner} aria-label="Primary navigation">
            <a className={styles.brand} href="#top" aria-label="Vertex home">
              <VertexMark />
              <span>Vertex</span>
            </a>
            <div className={styles.navLinks}>
              <Link href="/courses">Courses</Link>
              <a href="#my-learning">My Learning</a>
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
                  <Icon name="bell" size={25} />
                </button>
                <UserButton
                  appearance={{ elements: { avatarBox: styles.userAvatar } }}
                />
              </Show>
            </div>
          </nav>
        </header>

        <main id="top">
          <section className={styles.hero} aria-labelledby="home-heading">
            <p className={styles.eyebrow}>Intelligent Learning</p>
            <h1 id="home-heading"><span>Search your learning</span><span>in plain English.</span></h1>
            <p className={styles.heroCopy}>Vertex understands what you want to learn and<br />finds the exact lessons across all your courses.</p>
            <ExploreCTA className={styles.primaryCta} href="/courses">Explore Courses <Icon name="arrow" size={25} /></ExploreCTA>
            <SearchBox className={styles.searchBox}>
              <Icon name="search" size={32} />
              <label className={styles.srOnly} htmlFor="learning-search">Search your learning</label>
              <input id="learning-search" name="q" type="search" placeholder="Ask anything about your learning..." />
              <kbd>⌘ K</kbd>
            </SearchBox>
          </section>

          <section className={styles.coursesSection} id="courses" aria-labelledby="courses-heading">
            <div className={styles.coursesHeader}>
              <h2 id="courses-heading">All Courses</h2>
              <Link href="/courses">View all courses <Icon name="arrow" size={21} /></Link>
            </div>
            <div className={styles.courseGrid}>
              {courses.length > 0 ? (
                courses.map((course) => <CourseCard key={course._id} course={course} />)
              ) : (
                <p className={styles.emptyCourses}>Courses are being prepared.</p>
              )}
            </div>

            <div className={styles.weeklyMessage} id="my-learning">
              <span className={styles.messageRule} />
              <Icon name="star" size={27} />
              <p>New courses and lessons added every week.</p>
              <span className={styles.messageRule} />
            </div>

            <div className={styles.skyline} aria-hidden="true">
              {skylineHeights.map((height, index) => <span key={`${height}-${index}`} style={{ height }} />)}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
