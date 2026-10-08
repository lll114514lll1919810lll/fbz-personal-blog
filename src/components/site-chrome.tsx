import Link from "next/link";
import { CONTENT_MAX_WIDTH, navLinks, siteConfig } from "@/lib/site";
import { LinkPending } from "@/components/link-pending";

/**
 * 顶栏底栏共用的样式：通栏、直角、保留毛玻璃。
 *
 * 用 .panel 拿到半透明底 + 背景模糊 + 内高光，再用工具类把圆角去掉、
 * 去掉左右和一侧的边框——.panel 在 @layer components 里，
 * 工具类在 @layer utilities 里排在后面，能正常覆盖。
 *
 * 圆角去掉是因为通栏条一旦有圆角，四角会露出背景、看着像没铺满；
 * 直角加一条下边框才是「贴到屏幕边缘」该有的样子。
 */
const BAR = "panel rounded-none border-x-0";

export function SiteHeader() {
  return (
    // 直角通栏，贴住屏幕上沿
    <header className={`${BAR} sticky top-0 z-50 w-full border-t-0`}>
      <div
        className="mx-auto flex h-14 items-center justify-between px-6"
        style={{ maxWidth: CONTENT_MAX_WIDTH }}
      >
        {/* 链接用 py 撑出 44px 高的可点区域（触控热区标准），
            视觉上仍是小字，不影响排版密度 */}
        <Link
          href="/"
          className="-my-2 flex items-center py-2 text-sm font-semibold tracking-tight transition-colors hover:text-accent"
        >
          {siteConfig.name}
        </Link>

        <nav className="-my-2 flex items-center text-[13px] sm:gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center py-3 text-secondary transition-colors hover:text-foreground sm:py-2"
            >
              <LinkPending>{link.label}</LinkPending>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    /* 同样直角通栏，贴住屏幕下沿；只留上边框作为分隔。
       不在 footer 上加 pt——那是面板内部的padding，会把半透明底
       往上延伸；与正文之间的空隙由 main 的底部内边距提供。 */
    <footer className={`${BAR} mt-auto w-full border-b-0`}>
      <div
        className="mx-auto flex flex-col gap-1 px-6 py-6 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between"
        style={{ maxWidth: CONTENT_MAX_WIDTH }}
      >
        <p>
          © {new Date().getFullYear()} {siteConfig.author}
        </p>
        <p>风不止，但行有恒。</p>
      </div>
    </footer>
  );
}
