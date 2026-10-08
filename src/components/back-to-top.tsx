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
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      setVisible(window.scrollY > window.innerHeight * 0.8);
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
      className={`panel fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full text-secondary transition-[opacity,transform] duration-200 hover:text-accent ${
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
