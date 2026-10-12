import Link from "next/link";
import { siteConfig } from "@/lib/site";
import styles from "./home-hero.module.css";

/*
  首页 Hero 独立模块：文案 + 原子轨道动画整体自持，样式见 home-hero.module.css。
  文字侧沿用全局工具类（panel / eyebrow / button-primary 等），
  动画侧全部走本模块的哈希类名，改动画不会与框架同步的 globals.css 冲突。
*/
export function HomeHero() {
  return (
    <section className={`${styles.hero} panel panel-strong grid gap-10 overflow-hidden px-7 py-8 sm:px-10 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)] lg:items-center`}>
      <div className="relative z-10 flex flex-col gap-5">
        <p className="eyebrow">PERSONAL NOTES</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          把复杂的事，<span className="text-accent">写简单。</span>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-secondary">
          {siteConfig.description}
        </p>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-sm">
          <Link
            href="/blog"
            className="button-primary"
          >
            开始阅读
          </Link>
          <Link
            href="/about"
            className="-my-2 inline-flex items-center py-2 text-secondary transition-colors hover:text-foreground"
          >
            关于我 →
          </Link>
        </div>
      </div>

      <div className={styles.orbit} aria-hidden="true">
        <div className={styles.orbitCore}>
          <svg className={styles.atom} viewBox="0 0 160 160" fill="none" role="presentation">
            <ellipse cx="80" cy="80" rx="62" ry="24" stroke="currentColor" strokeWidth="4" />
            <ellipse
              cx="80"
              cy="80"
              rx="62"
              ry="24"
              transform="rotate(60 80 80)"
              stroke="currentColor"
              strokeWidth="4"
            />
            <ellipse
              cx="80"
              cy="80"
              rx="62"
              ry="24"
              transform="rotate(120 80 80)"
              stroke="currentColor"
              strokeWidth="4"
            />
            <circle cx="80" cy="80" r="14" fill="currentColor" />
          </svg>
        </div>
        <span className={`${styles.ring} ${styles.ringOne}`} />
        <span className={`${styles.ring} ${styles.ringOne} ${styles.ringLower}`} />
        <span className={styles.dot} />
        <span className={`${styles.dot} ${styles.dotTwo}`} />
      </div>
    </section>
  );
}
