import Link from "next/link";
import { CONTENT_MAX_WIDTH, LICENSE, navLinks, siteConfig } from "@/lib/site";
import { LinkPending } from "@/components/link-pending";
import { SiteLogo } from "@/components/site-logo";
import { SiteSearch } from "@/components/site-search";
import { ThemeToggle } from "@/components/theme-toggle";

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
        {/* 站点标识：占位圆形图标，见 site-logo.tsx。
            原来是站名文字，换成图标后顶栏左侧只占 44px，
            窄屏上让出了大量空间（320px 下品牌与首个链接的间距
            从 2.8px 变成 90px 以上） */}
        <SiteLogo />

        {/* 开关放在 nav 外面：它是站点控件，不是导航链接，
            混进去会让读屏在「导航」这一块里念到它 */}
        {/* gap 给导航和开关之间留出分组间距。链接之间是 12px（sm:gap-3），
            这里 12/16px 略大一点，让开关看起来是另一组东西；
            移动端只能给到 12px，再宽会在 375px 上把顶栏挤溢出 */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* gap-3 对所有尺寸生效。原来是 sm:gap-3，移动端四个链接挤成
              「首页文章标签关于」连在一起。站名换成 44px 图标后，窄屏
              腾出了位置：320px 下加完 3 个 12px 间距还剩 32px 余量 */}
          <nav className="-my-2 flex items-center text-[13px] gap-3">
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

          {/* 搜索放在开关左边。两者都自带 44px 热区，
              间距靠 gap-3/sm:gap-4，不需要额外内边距 */}
          <SiteSearch />

          {/* 开关自带 44px 热区，左右不用再加间距把热区撑开 */}
          <ThemeToggle />
        </div>
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
        className="mx-auto flex flex-col gap-3 px-6 py-6 text-[13px] text-muted sm:flex-row sm:items-end sm:justify-between"
        style={{ maxWidth: CONTENT_MAX_WIDTH }}
      >
        <div className="flex flex-col gap-1">
          <p>
            © {new Date().getFullYear()} {siteConfig.author}
          </p>
          <p>风不止，但行有恒。</p>
        </div>

        {/* 授权声明放在页脚而不是关于页：转载的人通常只翻到这个站最底部，
            才会去找「能不能转」的答案。写在这里，被爬到的概率最高。

            两条拆成两个链接而不是拼成一串：读者多半只关心自己那一档
            （想拿主题？点 MIT；想转文章？点 CC），分开点更省事。

            文字写「内容 / 源码」而不是「文章 / 代码」：
            页脚一行放不下长句子，短词在 320px 上也不会折行。 */}
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="whitespace-nowrap">
            内容 ·{" "}
            <a
              href={LICENSE.contentUrl}
              target="_blank"
              rel="noreferrer license"
              className="transition-colors hover:text-foreground"
            >
              {LICENSE.content}
            </a>
          </span>
          <span className="whitespace-nowrap">
            源码 ·{" "}
            <a
              href={LICENSE.codeUrl}
              target="_blank"
              rel="noreferrer license"
              className="transition-colors hover:text-foreground"
            >
              {LICENSE.code}
            </a>
          </span>
        </p>
      </div>
    </footer>
  );
}
