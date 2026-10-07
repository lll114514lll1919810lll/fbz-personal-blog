"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/posts";

/**
 * 追踪当前正在阅读的小节。
 *
 * 用 IntersectionObserver 观察标题元素，而不是监听 scroll 手动计算位置——
 * 前者由浏览器在合成线程上处理，长文滚动更顺滑，代码也短。
 */
export function useActiveHeading(items: TocItem[]): string {
  const [activeId, setActiveId] = useState("");

  // items 每次渲染都是新数组，直接放进依赖会导致观察器反复重挂。
  // 用内容拼成的字符串做依赖，只有目录真正变化时才重建。
  const key = items.map((item) => item.id).join("|");

  useEffect(() => {
    if (key === "") return;

    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headings.length === 0) return;

    const visible = new Map<string, boolean>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.set(entry.target.id, entry.isIntersecting);
        }
        // 取可见标题中文档顺序最靠前的那个
        const current = headings.find((h) => visible.get(h.id));
        if (current) setActiveId(current.id);
      },
      // 上边界下移 80px 给吸顶导航留余量；下边界收到视口 70% 处，
      // 这样「已滚过」的标题不会被算作当前项
      { rootMargin: "-80px 0px -70% 0px", threshold: [0, 1] },
    );

    for (const heading of headings) observer.observe(heading);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return activeId;
}