"use client";

import { useEffect, useState } from "react";
import { scrollToTop } from "@/lib/scroll";

/**
 * 回到顶部按钮。
 *
 * 只在文章页渲染（长文才需要），固定在右下角。
 *
 * 几个细节：
 * - 滚过约一屏才出现。刚进页面就冒出一个「回到顶部」是多余的。
 * - 隐藏时不能用 opacity: 0 了事——那样的按钮仍可被 Tab 聚焦，
 *   键盘用户会 tab 到一个看不见的东西。所以同时设 tabIndex=-1 和
 *   aria-hidden，把它真正移出可访问树。
 * - 44px 见方，满足触控热区标准。
 * - 用 .panel 拿毛玻璃底，rounded-full 覆盖掉面板的 14px 圆角变成圆形。
 * - 页脚进入视口时整体上移，别压住版权和落款。
 *   固定定位的按钮不会自己避让页脚——滚到底时页脚正好滑到右下角，
 *   按钮就盖在「风不止，但行有恒。」上面。这里按页脚顶边到视口底边的距离
 *   实时抬高，页脚往上顶多少、按钮就抬多少，看起来像被页脚顶上去的。
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [lift, setLift] = useState(0);

  useEffect(() => {
    let frame = 0;
    let footer: HTMLElement | null = null;

    const update = () => {
      frame = 0;
      setVisible(window.scrollY > window.innerHeight * 0.8);

      footer = footer ?? document.querySelector("footer");
      if (!footer) return;
      // 页脚顶边一旦进入视口，就开始把按钮往上顶
      const overlap = window.innerHeight - footer.getBoundingClientRect().top;
      // 上限是别把自己顶出屏幕顶部
      setLift(Math.max(0, Math.min(overlap, window.innerHeight - 160)));
    };

    // rAF 节流：滚动事件触发极频繁，直接 setState 会掉帧
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="回到顶部"
      title="回到顶部"
      // 隐藏时移出 Tab 顺序与可访问树，避免聚焦到不可见元素
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      // bottom 用行内样式，因为它随滚动逐帧变化，不适合写成工具类
      style={{ bottom: `calc(1.5rem + ${lift}px)` }}
      className={`panel fixed right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full text-secondary transition-[opacity,transform] duration-200 hover:text-accent ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden
      >
        <path
          d="M9 14.5V4M4.5 8.5L9 4l4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
