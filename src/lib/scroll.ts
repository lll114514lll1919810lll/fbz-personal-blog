/**
 * 平滑滚动到锚点。
 *
 * 不用浏览器原生的锚点跳转：它是瞬间到位的长距离「传送」，
 * 读者会丢失位置感。缓动滚动能让眼睛跟得上。
 *
 * 两条额外处理：
 * 1. 目标标题不能被吸顶导航挡住。把目标位置对齐到视口 1/3 处，
 *    自然就避开了顶栏，也和目录高亮的判定标准保持一致。
 * 2. 尊重系统的「减少动态效果」：开启时直接跳，不做缓动。
 */

/** 三次缓出：起步快、收尾稳，长距离也不拖沓。 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToAnchor(anchorId: string): void {
  const target = document.getElementById(anchorId);
  if (!target) return;

  // 阅读线放在视口 1/3 处，和目录高亮的判定保持一致：
  // 滚过去后标题正好落在视线中心，不会让人觉得"滚过头了"
  const readingLine = window.innerHeight / 3;
  const targetTop =
    window.scrollY + target.getBoundingClientRect().top - readingLine;

  const start = window.scrollY;
  const distance = targetTop - start;

  // 已经到位或方向相反距离很短时直接跳，省掉一次动画
  if (prefersReducedMotion() || Math.abs(distance) < 8) {
    window.scrollTo(0, targetTop);
    return;
  }

  const duration = Math.min(760, Math.max(320, Math.abs(distance) * 0.45));

  let startTime: number | null = null;

  const step = (timestamp: number) => {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(1, elapsed / duration);

    window.scrollTo(0, start + distance * easeOutCubic(progress));

    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

/**
 * 把某个元素滚动到可视区域内。
 *
 * 用于目录侧栏自身：点击父级标题展开子项后，如果侧栏里的条目
 * 在可视区外，读者会看不到自己刚展开了什么。
 */
export function scrollIntoViewIfNeeded(
  element: HTMLElement,
  container: HTMLElement,
): void {
  const itemRect = element.getBoundingClientRect();
  const boxRect = container.getBoundingClientRect();

  // 已经在可视范围内就不动，避免不必要的跳动
  if (
    itemRect.top >= boxRect.top &&
    itemRect.bottom <= boxRect.bottom
  ) {
    return;
  }

  const offset =
    itemRect.top - boxRect.top - (boxRect.height - itemRect.height) / 2;
  container.scrollTop += offset;
}