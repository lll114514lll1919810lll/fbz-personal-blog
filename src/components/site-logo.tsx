import Link from "next/link";
import { siteConfig } from "@/lib/site";

/**
 * 顶栏左上角的站点标识。
 *
 * 现在是**占位**：一枚圆形底 + 站名首字。等有正式 logo 了，把里面那个
 * <span> 换成图片就行，尺寸和圆形裁切都由 .site-logo-badge 负责：
 *
 *   import Image from "next/image";
 *   <Image src="/logo.png" alt="" width={32} height={32} className="site-logo-badge" />
 *
 * 图片放进 public/。换成 SVG 图标同理。
 *
 * 文字变成图标之后链接里没有可读文字了，所以 aria-label 是必须的
 * （读屏会念「风不止的个人博客，链接」），title 负责鼠标悬停提示。
 * 圆点本身 aria-hidden，否则读屏会把首字也念一遍。
 */
export function SiteLogo() {
  return (
    <Link
      href="/"
      aria-label={siteConfig.name}
      title={siteConfig.name}
      /* h-11 w-11：44px 触控热区；rounded-full 让焦点框跟着圆点走，
         而不是画一个方形框。flex-none 保证窄屏上不会被挤扁。 */
      className="site-logo flex h-11 w-11 flex-none items-center justify-center rounded-full"
    >
      <span className="site-logo-badge" aria-hidden="true">
        {siteConfig.name.slice(0, 1)}
      </span>
    </Link>
  );
}
