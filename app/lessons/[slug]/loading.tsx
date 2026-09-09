import styles from "./loading.module.css";

export default function LessonLoading() {
  return (
    <div className={styles.viewport} aria-busy="true" aria-label="Loading lesson">
      <div className={styles.pageFrame}>
        <div className={styles.header} aria-hidden="true"><i /><i /><i /></div>
        <div className={styles.layout} aria-hidden="true">
          <aside className={styles.sidebar}>
            <span className={styles.back} />
            <span className={styles.course} />
            {Array.from({ length: 6 }, (_, index) => <span className={styles.module} key={index} />)}
          </aside>
          <main className={styles.main}>
            <span className={styles.breadcrumb} />
            <span className={styles.badge} />
            <span className={styles.title} />
            <span className={styles.copy} />
            <span className={styles.meta} />
            <span className={styles.video} />
            <span className={styles.tabs} />
            <span className={styles.content} />
          </main>
        </div>
      </div>
    </div>
  );
}
