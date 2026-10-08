import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ReadingProgress } from "@/components/reading-progress";
import { PageTransition } from "@/components/page-transition";
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
        {/* 顶栏和底栏在 PageTransition 之外，切换页面时保持静止 */}
        <SiteHeader />
        <PageTransition>{children}</PageTransition>
        <SiteFooter />
      </body>
    </html>
  );
}