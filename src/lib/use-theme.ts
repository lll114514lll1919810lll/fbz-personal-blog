"use client";

import { useSyncExternalStore } from "react";
import {
  DARK_QUERY,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "@/lib/theme";

/**
 * 明暗主题的运行时：读、写、切、订阅。
 * 类型和引导脚本在 theme.ts（那边不能依赖 React，见文件里的说明）。
 *
 * 主题的唯一来源是 <html> 上的 data-theme 属性，而不是这里的变量：
 * 内联引导脚本在浏览器解析 HTML、首次绘制之前就把它写好了，CSS 直接依赖它。
 * React 只负责读出来给无障碍属性和点击用——如果反过来让 React 状态决定外观，
 * 服务端只能渲染一种主题，深色用户会先看到浅色再跳变。
 */

/** 读用户手动选过的主题；没选过（或读不到）返回 null，表示「跟随系统」 */
function readStored(): ThemeMode | null {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "dark" || saved === "light" ? saved : null;
  } catch {
    return null;
  }
}

function systemPrefersDark(): boolean {
  try {
    return window.matchMedia(DARK_QUERY).matches;
  } catch {
    return false;
  }
}

/** 把主题写到 DOM 上。CSS 和浏览器控件都看这两个地方 */
export function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  // color-scheme 决定滚动条、表单控件、超范围画布的配色。
  // 内联样式优先级最高，能压过 globals.css 里的媒体查询。
  root.style.colorScheme = theme;
}

/**
 * 按「当前偏好」重新应用一次主题。
 *
 * 给开发模式用：React Strict Mode 会重挂载一次并重置 <html> 上的属性，
 * 把脚本写好的 data-theme 清掉。这个方法从同一份数据源重算，幂等，
 * 生产环境调用等于空转。
 */
export function reapplyTheme() {
  applyTheme(readStored() ?? (systemPrefersDark() ? "dark" : "light"));
}

// localStorage 和 matchMedia 都不是响应式的，用一张订阅表把变化推给 hook
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribeTheme(callback: () => void) {
  listeners.add(callback);

  const media = window.matchMedia(DARK_QUERY);

  // 没手动选过的时候，系统偏好在页面开着时变化要实时跟上；
  // 手动选过就说明用户已经表态，不再被系统带走
  const onSystemChange = () => {
    if (readStored() !== null) return;
    applyTheme(media.matches ? "dark" : "light");
    emit();
  };

  // 同一份偏好在另一个标签页被改了，这个标签页也跟着变
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    applyTheme(readStored() ?? (media.matches ? "dark" : "light"));
    emit();
  };

  media.addEventListener("change", onSystemChange);
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(callback);
    media.removeEventListener("change", onSystemChange);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * 当前生效的主题，直接从 DOM 上读。
 * 用 DOM 而不是 localStorage 作快照，是因为「跟随系统」时 localStorage 是空的，
 * 而 DOM 上永远是最终结果——开关要显示的就是这个。
 */
function getThemeSnapshot(): ThemeMode {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** 服务端没有 DOM，给一个固定值保证 HTML 一致；水合后会立刻按真实值重渲染 */
function getServerThemeSnapshot(): ThemeMode {
  return "light";
}

/**
 * 切换主题。把选择存起来之后就不再跟随系统了——
 * 开关是两态的，没有「回到自动」这一档；想恢复自动需要清掉 localStorage。
 */
export function toggleTheme() {
  const next: ThemeMode = getThemeSnapshot() === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // 存不了也照样切，只是刷新后回到系统偏好
  }
  applyTheme(next);
  emit();
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  return { theme, isDark: theme === "dark", toggle: toggleTheme };
}
