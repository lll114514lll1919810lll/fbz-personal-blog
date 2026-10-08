import Link from "next/link";
import { CONTENT_MAX_WIDTH, navLinks, siteConfig } from "@/lib/site";
import { LinkPending } from "@/components/link-pending";

export function SiteHeader() {
  return (
    /* 顶栏做成悬浮的圆角亚克力条：
       外层只负责吸顶和留出四周缝隙，面板本身由内层承担，
       这样它能浮在背景图之上，而不是把整条横幅糊死。 */
    <header className="sticky top-3 z-50 w-full px-4">
      <div
        className="panel mx-auto flex h-14 items-center justify-between px-5"
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
    <footer className="mt-auto w-full px-4 pb-4 pt-10">
      <div
        className="panel mx-auto flex flex-col gap-1 px-6 py-6 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between"
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
