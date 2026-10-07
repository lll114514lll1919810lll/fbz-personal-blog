import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ReadingProgress } from "@/components/reading-progress";
import { siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`, // 子页面标题自动加上站点名
  },
  description: siteConfig.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // lang 告诉浏览器和搜索引擎这是简体中文站点
    <html lang="zh-CN" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ReadingProgress />
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-14">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}