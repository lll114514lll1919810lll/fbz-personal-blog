import Link from "next/link";
import { navLinks, siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
        <Link href="/" className="font-semibold tracking-tight hover:text-accent">
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
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
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto max-w-3xl px-6 py-8 text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {siteConfig.author} ·{" "}
          <Link href="/" className="hover:text-foreground">
            {siteConfig.name}
          </Link>
        </p>
        <p className="mt-1">风不止，但行有恒。</p>
      </div>
    </footer>
  );
}