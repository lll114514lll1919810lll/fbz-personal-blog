"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * 正文宽度的档位设置。
 *
 * 每档给出正文内容区的 max-width，用 rem 而不是 px：
 * 中文字宽是全角，px 宽度在不同字号下对应的字数会飘，
 * 而 rem 会跟着根字号一起缩放。
 *
 * 三档等距：36 / 52 / 68，每档相差16rem。跨度必须一致，
 * 否则从「标准」切到「宽」会感觉跳了一大步，回切又觉得没变化。
 *
 * 最宽档的 68rem 是算出来的：桌面端正文 + 目录侧栏(16rem) + 间距(3rem)
 * 整块约占顶栏内容区(CONTENT_MAX_WIDTH 减内边距)的 80%，
 * 即 68 + 16 + 3 = 87rem ≈ 1392px / 1744px ≈ 79.8%。
 * 想继续加宽就调这里，注意侧栏宽度在 table-of-contents.tsx 里是 w-64。
 */
export const READING_WIDTHS = [
  { id: "narrow", label: "窄", hint: "每行约 34 字", maxWidth: "36rem" },
  { id: "medium", label: "标准", hint: "每行约 49 字", maxWidth: "52rem" },
  { id: "wide", label: "宽", hint: "每行约 64 字", maxWidth: "68rem" },
] as const;

export type WidthId = (typeof READING_WIDTHS)[number]["id"];

const STORAGE_KEY = "fbz-reading-width";
const DEFAULT_ID: WidthId = "medium";

function isWidthId(value: unknown): value is WidthId {
  return READING_WIDTHS.some((w) => w.id === value);
}

/** localStorage 不可用时（隐私模式等）降级为默认值 */
function readStored(): WidthId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isWidthId(saved) ? saved : DEFAULT_ID;
  } catch {
    return DEFAULT_ID;
  }
}

// localStorage 不是响应式的，用一个简单的订阅表让 hook 能感知变化
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  // 同一页面可能有多处用到宽度（比如标题栏和控制条），跨标签页同步一下
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

/** 服务端渲染时没有 localStorage，返回默认值保证 HTML 一致 */
function getServerSnapshot(): WidthId {
  return DEFAULT_ID;
}

/**
 * 读取并保存用户选择的正文宽度。
 *
 * 用 useSyncExternalStore 而不是 useState + useEffect：
 * 后者需要在挂载后同步 setState 读一次偏好，会多渲染一轮、
 * 并触发 react-hooks/set-state-in-effect 警告；
 * 前者由 React 专门处理「外部数据 + SSR 水合」，行为更干净。
 */
export function useReadingWidth() {
  const widthId = useSyncExternalStore(subscribe, readStored, getServerSnapshot);

  const setWidth = useCallback((id: WidthId) => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // 存不了就算了，本次会话内仍然生效
    }
    // 手动通知订阅者，否则同页面的其他使用方不会更新
    for (const listener of listeners) listener();
  }, []);

  return { widthId, setWidth };
}