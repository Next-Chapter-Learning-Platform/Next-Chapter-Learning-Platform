import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";
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

function NextMark() {
  return <div className={`${styles.courseMark} ${styles.nextMark}`} aria-hidden="true">N</div>;
}

function DockerMark() {
  return (
    <div className={`${styles.courseMark} ${styles.dockerMark}`} aria-hidden="true">
      <svg viewBox="0 0 76 76">
        <g fill="#2496ed" stroke="#123b68" strokeWidth="1.3">
          <rect x="18" y="24" width="9" height="8" rx="1" /><rect x="29" y="24" width="9" height="8" rx="1" />
          <rect x="40" y="24" width="9" height="8" rx="1" /><rect x="29" y="14" width="9" height="8" rx="1" />
          <rect x="40" y="14" width="9" height="8" rx="1" /><rect x="40" y="4" width="9" height="8" rx="1" />
          <rect x="51" y="24" width="9" height="8" rx="1" />
          <path d="M8 34h49c2-7 8-9 13-5-2 4-5 6-9 7-3 18-14 27-29 27C18 63 9 53 8 34Z" />
        </g>
        <path d="M16 42c7 2 17 2 29-1" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity=".8" />
        <circle cx="18" cy="39" r="1.2" fill="#fff" />
      </svg>
    </div>
  );
}

function TypeScriptMark() {
  return <div className={`${styles.courseMark} ${styles.typescriptMark}`} aria-hidden="true">TS</div>;
}

type Course = {
  title: string;
  description: string;
  level: string;
  duration: string;
  modules: string;
  mark: ReactNode;
};

const courses: Course[] = [
  {
    title: "Next.js for Production",
    description: "Build scalable, high-performance web applications with Next.js.",
    level: "Intermediate",
    duration: "18h 24m",
    modules: "12 modules",
    mark: <NextMark />,
  },
  {
    title: "Docker Essentials",
    description: "Containerize applications and streamline your development workflow.",
    level: "Beginner",
    duration: "10h 12m",
    modules: "8 modules",
    mark: <DockerMark />,
  },
  {
    title: "TypeScript Deep Dive",
    description: "Go beyond the basics and write safer, more expressive code.",
    level: "Intermediate",
    duration: "14h 36m",
    modules: "10 modules",
    mark: <TypeScriptMark />,
  },
];

function CourseCard({ course }: { course: Course }) {
  return (
    <article className={styles.courseCard}>
      {course.mark}
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      <div className={styles.courseMeta}>
        <span><Icon name="signal" size={16} />{course.level}</span>
        <span><Icon name="clock" size={16} />{course.duration}</span>
        <span><Icon name="file" size={16} />{course.modules}</span>
      </div>
    </article>
  );
}

const skylineHeights = [88, 120, 160, 195, 142, 126, 80, 46, 75, 108, 145, 193, 126, 84, 148, 175];

export default function Home() {
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
              <a href="#courses">Courses</a>
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
            <a className={styles.primaryCta} href="#courses">Explore Courses <Icon name="arrow" size={25} /></a>
            <div className={styles.searchBox} role="search">
              <Icon name="search" size={32} />
              <label className={styles.srOnly} htmlFor="learning-search">Search your learning</label>
              <input id="learning-search" name="q" type="search" placeholder="Ask anything about your learning..." />
              <kbd>⌘ K</kbd>
            </div>
          </section>

          <section className={styles.coursesSection} id="courses" aria-labelledby="courses-heading">
            <div className={styles.coursesHeader}>
              <h2 id="courses-heading">All Courses</h2>
              <a href="#courses">View all courses <Icon name="arrow" size={21} /></a>
            </div>
            <div className={styles.courseGrid}>
              {courses.map((course) => <CourseCard key={course.title} course={course} />)}
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
