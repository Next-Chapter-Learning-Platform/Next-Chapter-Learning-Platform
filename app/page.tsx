import type { CSSProperties, ReactNode } from "react";
import styles from "./page.module.css";

type IconName =
  | "bell"
  | "search"
  | "play"
  | "file"
  | "bookmark"
  | "bars"
  | "clock"
  | "user"
  | "chevron"
  | "external"
  | "lock"
  | "check"
  | "eye"
  | "grid"
  | "target"
  | "accessibility"
  | "folder";

function Icon({ name, size = 18, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: filled ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: filled ? 1.4 : 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "bell":
      return <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>;
    case "search":
      return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
    case "play":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4Z" fill={filled ? "white" : "none"} /></svg>;
    case "file":
      return <svg {...common}><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5M9 12h6M9 16h6" /></svg>;
    case "bookmark":
      return <svg {...common}><path d="M6 3h12v18l-6-4-6 4z" /></svg>;
    case "bars":
      return <svg {...common}><path d="M5 20v-5h3v5zM11 20V9h3v11zM17 20V4h3v16z" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "user":
      return <svg {...common}><circle cx="12" cy="8" r="3" /><path d="M5 21c.6-4 2.9-6 7-6s6.4 2 7 6" /></svg>;
    case "chevron":
      return <svg {...common}><path d="m9 5 7 7-7 7" /></svg>;
    case "external":
      return <svg {...common}><path d="M14 5h5v5M19 5l-8 8" /><path d="M17 13v6H5V7h6" /></svg>;
    case "lock":
      return <svg {...common}><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
    case "check":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></svg>;
    case "eye":
      return <svg {...common}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12" /><circle cx="12" cy="12" r="2.5" /></svg>;
    case "grid":
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
    case "target":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 12 21 3M16 3h5v5" /></svg>;
    case "accessibility":
      return <svg {...common}><circle cx="12" cy="4" r="2" /><path d="M5 8h14M12 6v6m0 0-4 9m4-9 4 9" /></svg>;
    case "folder":
      return <svg {...common}><path d="M3 6h7l2 2h9v11H3z" /></svg>;
  }
}

function VertexMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className={styles.vertexMark}>
      <path d="M2 5h36L20 37 2 5Z" fill="#f04b16" />
      <path d="M11 10h18l-9 16-9-16Z" fill="white" />
      <path d="M15 10h10l-5 9-5-9Z" fill="#f04b16" />
    </svg>
  );
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return <div className={styles.sectionHeader}><span>{number}</span><h2>{title}</h2></div>;
}

function Panel({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={`${styles.panel} ${className}`}>{children}</section>;
}

const primaryColors = [
  ["Primary 500", "#F97316"], ["Primary 400", "#FB923C"], ["Primary 300", "#FDBA74"],
  ["Primary 200", "#FED7AA"], ["Primary 100", "#FFEEE5"],
];

const neutralColors = [
  ["Neutral 900", "#0F172A"], ["Neutral 700", "#334155"], ["Neutral 500", "#64748B"],
  ["Neutral 300", "#CBD5E1"], ["Neutral 200", "#E2E8F0"], ["Neutral 100", "#F1F5F9"],
  ["Neutral 50", "#FAFAFC"], ["White", "#FFFFFF"],
];

const typeScale = [
  ["Display 1", "Playfair Display", "48 / 56", "Bold", "Page titles"],
  ["Display 2", "Playfair Display", "36 / 44", "Bold", "Section titles"],
  ["Heading 1", "Inter", "28 / 36", "Semi Bold", "Card titles"],
  ["Heading 2", "Inter", "22 / 30", "Semi Bold", "Sub section"],
  ["Heading 3", "Inter", "18 / 26", "Medium", "Small titles"],
  ["Body Large", "Inter", "16 / 24", "Regular", "Body copy"],
  ["Body", "Inter", "14 / 20", "Regular", "Supporting text"],
  ["Small", "Inter", "12 / 16", "Regular", "Captions, meta"],
];

const spacingScale = [[4, "0.25rem"], [8, "0.5rem"], [12, "0.75rem"], [16, "1rem"], [24, "1.5rem"], [32, "2rem"], [40, "2.5rem"], [48, "3rem"], [64, "4rem"]] as const;

function ColorSwatch({ label, hex }: { label: string; hex: string }) {
  return (
    <div className={styles.swatchItem}>
      <span className={styles.swatch} style={{ "--swatch-color": hex } as CSSProperties} />
      <span>{label}</span><code>{hex}</code>
    </div>
  );
}

function Badge({ tone, children }: { tone: "video" | "lesson" | "popular"; children: ReactNode }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}

function Meta({ icon, children }: { icon?: IconName; children: ReactNode }) {
  return <span className={styles.meta}>{icon && <Icon name={icon} size={13} />}{children}</span>;
}

export default function Home() {
  const iconNames: IconName[] = ["bell", "search", "play", "file", "bookmark", "bars", "clock", "user", "chevron"];

  return (
    <main className={styles.page} id="top">
      <Panel className={styles.heroPanel}>
        <div className={styles.intro}>
          <div className={styles.brand}><VertexMark /><span>Vertex</span></div>
          <h1>Design System</h1>
          <p>A unified design language for Vertex learning platform. Clean, modern and focused on clarity, consistency and intuitive learning experiences.</p>
          <div className={styles.version}><span>Version 1.0</span><i /><span>May 2025</span></div>
        </div>
        <div className={styles.colors}>
          <SectionHeader number="01" title="Colors" />
          <div className={styles.colorGroup}><h3>Primary</h3><div className={styles.primarySwatches}>{primaryColors.map(([label, hex]) => <ColorSwatch key={label} label={label} hex={hex} />)}</div></div>
          <div className={styles.colorGroup}><h3>Neutral</h3><div className={styles.neutralSwatches}>{neutralColors.map(([label, hex]) => <ColorSwatch key={label} label={label} hex={hex} />)}</div></div>
        </div>
      </Panel>

      <div className={styles.twoColumnTop}>
        <Panel>
          <SectionHeader number="02" title="Typography" />
          <div className={styles.fontSample}><span className={styles.playfairAg}>Ag</span><div><h3 className={styles.playfairName}>Playfair Display</h3><p>Elegant <i /> Readable <i /> Timeless</p></div></div>
          <div className={styles.fontSample}><span className={styles.interAg}>Ag</span><div><h3>Inter</h3><p>Clean <i /> Modern <i /> Highly legible</p></div></div>
        </Panel>
        <Panel>
          <SectionHeader number="03" title="Type Scale" />
          <div className={styles.tableScroll}><table className={styles.typeTable}><thead><tr><th>Style</th><th>Font</th><th>Size / Line Height</th><th>Weight</th><th>Use</th></tr></thead><tbody>{typeScale.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${cell}`} className={index === 0 ? styles.typeStyle : undefined}>{cell}</td>)}</tr>)}</tbody></table></div>
        </Panel>
      </div>

      <div className={styles.spacingRow}>
        <Panel>
          <SectionHeader number="04" title="Spacing System" />
          <p className={styles.baseUnit}>Base unit: 4px</p>
          <div className={styles.spacingScale}>{spacingScale.map(([value, rem]) => <div className={styles.spacingItem} key={value}><span className={styles.spacingBlock} style={{ "--space-size": `${value}px` } as CSSProperties} /><strong>{value}</strong><small>({rem})</small></div>)}</div>
        </Panel>
        <Panel>
          <SectionHeader number="05" title="Radius & Shadows" />
          <h3 className={styles.subLabel}>Radius</h3>
          <div className={styles.radiusScale}>{[["4px", "xs"], ["8px", "sm"], ["12px", "md"], ["16px", "lg"], ["24px", "xl"], ["50%", "circle"]].map(([radius, label]) => <div className={styles.radiusItem} key={radius}><span style={{ borderRadius: radius }} /><strong>{radius === "50%" ? "Full" : radius}</strong><small>({label})</small></div>)}</div>
          <h3 className={styles.subLabel}>Shadows</h3>
          <div className={styles.shadowScale}>{[["Sm", "0 1px 2px 0", "rgba(15, 23, 42, 0.05)"], ["Md", "0 4px 12px -2px", "rgba(15, 23, 42, 0.08)"], ["Lg", "0 12px 24px -4px", "rgba(15, 23, 42, 0.10)"], ["Xl", "0 20px 40px -8px", "rgba(15, 23, 42, 0.12)"]].map(([name, value, color], index) => <div className={`${styles.shadowCard} ${styles[`shadow${index + 1}`]}`} key={name}><strong>{name}</strong><small>{value}</small><small>{color}</small></div>)}</div>
        </Panel>
      </div>

      <div className={styles.componentsRow}>
        <Panel>
          <SectionHeader number="06" title="Icons" />
          <h3 className={styles.subLabel}>Outline Style</h3><div className={styles.iconRow}>{iconNames.map((name) => <span key={`outline-${name}`}><Icon name={name} /></span>)}</div>
          <h3 className={styles.subLabel}>Filled Style</h3><div className={styles.iconRow}>{iconNames.map((name) => <span key={`filled-${name}`}><Icon name={name} filled /></span>)}</div>
          <h3 className={styles.subLabel}>Icon Specs</h3><ul className={styles.specList}><li>24×24px grid</li><li>2px stroke width (outline)</li><li>Rounded line caps</li><li>Consistent optical balance</li></ul>
        </Panel>
        <Panel>
          <SectionHeader number="07" title="Buttons" />
          <div className={styles.buttonTable}>
            <div /><span>Primary</span><span>Secondary</span><span>Tertiary</span><span>Text</span>
            <strong>Default</strong><button type="button" className={styles.primaryButton}>Get Started</button><button type="button" className={styles.secondaryButton}>Explore Courses</button><button type="button" className={styles.tertiaryButton}>View Lesson <Icon name="external" size={13} /></button><button type="button" className={styles.textButton}>Watch Video <Icon name="play" size={14} /></button>
            <strong>Hover</strong><button type="button" className={`${styles.primaryButton} ${styles.forcedHover}`}>Get Started</button><button type="button" className={`${styles.secondaryButton} ${styles.forcedHover}`}>Explore Courses</button><button type="button" className={`${styles.tertiaryButton} ${styles.forcedHover}`}>View Lesson <Icon name="external" size={13} /></button><button type="button" className={`${styles.textButton} ${styles.forcedHover}`}>Watch Video <Icon name="play" size={14} /></button>
            <strong>Disabled</strong><button type="button" className={styles.primaryButton} disabled>Get Started</button><button type="button" className={styles.secondaryButton} disabled>Explore Courses</button><button type="button" className={styles.tertiaryButton} disabled>View Lesson <Icon name="external" size={13} /></button><button type="button" className={styles.textButton} disabled>Watch Video <Icon name="play" size={14} /></button>
          </div>
          <h3 className={styles.subLabel}>Button Specs</h3><ul className={styles.specList}><li>Height: 44px (default)</li><li>Padding: 0 16px (lg), 0 12px (md)</li><li>Radius: 12px</li><li>Font: Inter Medium (14–16px)</li></ul>
        </Panel>
        <Panel>
          <SectionHeader number="08" title="Inputs" />
          <label className={styles.fieldLabel} htmlFor="search-example">Search / Text Input</label><div className={styles.searchField}><Icon name="search" size={17} /><input id="search-example" type="search" placeholder="Search anything..." /><kbd>⌘ K</kbd></div>
          <label className={styles.fieldLabel} htmlFor="sort-example">Select</label><select id="sort-example" className={styles.selectField} defaultValue="Most Relevant"><option>Most Relevant</option><option>Newest</option></select>
          <h3 className={styles.subLabel}>Field Specs</h3><ul className={styles.specList}><li>Height: 44px</li><li>Radius: 12px</li><li>Border: 1px solid #E2E8F0</li><li>Padding: 0 16px</li><li>Focus: Border color #FB923C</li></ul>
        </Panel>
      </div>

      <div className={styles.statusRow}>
        <Panel><SectionHeader number="09" title="Badges / Tags" /><div className={styles.badgeGrid}><div><span>Video</span><Badge tone="video">Video</Badge></div><div><span>Lesson</span><Badge tone="lesson">Lesson</Badge></div><div><span>Popular</span><Badge tone="popular">Popular</Badge></div></div></Panel>
        <Panel><SectionHeader number="10" title="Status / Indicators" /><div className={styles.statusList}><span><i className={styles.inProgress} />In Progress</span><span className={styles.complete}><Icon name="check" size={17} />Completed</span><span className={styles.nowPlaying}><Icon name="play" size={17} filled />Now Playing</span><span><Icon name="lock" size={17} />Locked</span></div></Panel>
        <Panel><SectionHeader number="11" title="Progress Bar" /><div className={styles.progressDemo}><div className={styles.progressTrack}><span /></div><strong>35% <span>complete</span></strong></div></Panel>
      </div>

      <Panel className={styles.cardsPanel}>
        <SectionHeader number="12" title="Cards" />
        <div className={styles.cardGrid}>
          <div className={styles.cardSpecimen}><span className={styles.cardLabel}>Course Card</span><article className={styles.courseCard}><div className={styles.courseTop}><div className={styles.nextLogo}>N</div><div><h3>Next.js for Production</h3><p>Build scalable, high-performance web applications with Next.js.</p></div></div><div className={styles.cardMetaRow}><Meta icon="bars">Intermediate</Meta><Meta icon="clock">18h 24m</Meta><Meta icon="folder">12 modules</Meta></div></article></div>
          <div className={styles.cardSpecimen}><span className={styles.cardLabel}>Lesson Card (Video)</span><article className={styles.lessonCard} id="lesson-video"><Badge tone="video">Video</Badge><h3>Data Fetching in Server Components</h3><p>Learn how to fetch data on the server using async/await and Next.js best practices.</p><div className={styles.cardFooter}><Meta>Lesson 5.1&nbsp;&nbsp;·&nbsp;&nbsp;12:45</Meta><a href="#lesson-video">Watch from 12:45 <Icon name="play" size={14} /></a></div></article></div>
          <div className={styles.cardSpecimen}><span className={styles.cardLabel}>Lesson Card (Lesson)</span><article className={styles.lessonCard} id="lesson"><Badge tone="lesson">Lesson</Badge><h3>Data Fetching &amp; Caching</h3><p>Explore different data fetching methods in Next.js and how to cache and revalidate data for optimal performance.</p><div className={styles.cardFooter}><Meta>Module 5</Meta><a href="#lesson">View lesson <Icon name="external" size={14} /></a></div></article></div>
          <div className={styles.cardSpecimen}><span className={styles.cardLabel}>Resource Card</span><article className={styles.resourceCard} id="resource"><div className={styles.resourceTop}><Icon name="file" size={24} /><div><h3>Caching and Revalidation Guide</h3><p>Deep dive into Next.js caching strategies.</p></div></div><div className={styles.cardFooter}><Meta>PDF&nbsp;&nbsp;·&nbsp;&nbsp;1.2 MB</Meta><a href="#resource" aria-label="Open resource"><Icon name="external" size={15} /></a></div></article></div>
        </div>
      </Panel>

      <Panel className={styles.navigationPanel}>
        <SectionHeader number="13" title="Navigation" />
        <div className={styles.navigationGrid}>
          <nav className={styles.mainNav} aria-label="Example primary navigation"><a href="#top" className={styles.navBrand}><VertexMark size={25} /><span>Vertex</span></a><a href="#courses" className={styles.activeNav}>Courses</a><a href="#learning">My Learning</a></nav>
          <nav className={styles.breadcrumbs} aria-label="Example breadcrumb"><span>Breadcrumbs</span><ol><li><a href="#all-courses">All Courses</a></li><li><Icon name="chevron" size={13} /></li><li><a href="#next-course">Next.js for Production</a></li><li><Icon name="chevron" size={13} /></li><li aria-current="page">Data Fetching &amp; Caching</li></ol></nav>
          <nav className={styles.pagination} aria-label="Example pagination"><span>Pagination</span><div><button type="button" aria-label="Previous page" className={styles.previousPage}><Icon name="chevron" size={15} /></button><button type="button" className={styles.currentPage} aria-current="page">1</button><button type="button">2</button><button type="button">3</button><span>…</span><button type="button">8</button><button type="button" aria-label="Next page"><Icon name="chevron" size={15} /></button></div></nav>
        </div>
      </Panel>

      <Panel className={styles.principlesPanel}>
        <SectionHeader number="14" title="Principles" />
        <div className={styles.principlesGrid}>{[["eye", "Clarity First", "Every element should communicate clearly."], ["grid", "Consistency", "Use components and patterns consistently across the platform."], ["target", "Focus & Calm", "Remove noise and help learners focus on what matters."], ["accessibility", "Accessible", "Design with accessibility and inclusivity in mind."]].map(([icon, title, description]) => <div className={styles.principle} key={title}><span className={styles.principleIcon}><Icon name={icon as IconName} size={25} /></span><div><h3>{title}</h3><p>{description}</p></div></div>)}</div>
      </Panel>
    </main>
  );
}
