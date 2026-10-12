import Link from "next/link";
import { siteConfig } from "@/lib/site";
import styles from "./home-hero.module.css";
import { OrbitSandbox } from "./orbit-sandbox";

/*
  首页 Hero：左侧文案 + 右侧可玩的轨道沙盒。
  文字侧沿用全局工具类（panel / eyebrow / button-primary 等）；
  右侧沙盒整体自持在 orbit-sandbox.tsx / orbit-sandbox.module.css，
  改沙盒交互或样式不会与框架同步的 globals.css 冲突。
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

      <OrbitSandbox />
    </section>
  );
}
