import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/site";

/**
 * 顶栏左上角的站点标识。
 *
 * 图片放在 public/，尺寸和圆形裁切由 .site-logo-badge 负责。
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
      <Image
        src="/site-logo.jpg"
        alt=""
        width={32}
        height={32}
        className="site-logo-badge"
        aria-hidden="true"
      />
    </Link>
  );
}
