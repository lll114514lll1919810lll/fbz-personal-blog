import Link from "next/link";
import { CONTENT_MAX_WIDTH, navLinks, siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    // 外层负责全宽：背景和下边框线一直延伸到屏幕两端
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      {/* 内层限制内容宽度并居中。用较宽的上限，让站名和导航更靠近屏幕两侧，
          避免在超宽屏上挤在中间一小块。 */}
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
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-border">
      <div
        className="mx-auto flex flex-col gap-1 px-6 py-10 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between"
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