"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { GlassConfig, LiquidGlass } from "@ybouane/liquidglass";
import { setLabRuntimeStatus } from "@/lib/lab-runtime-status";

/**
 * 液态玻璃面板材质（实验室实验，用 MIT 的 @ybouane/liquidglass）。
 *
 * 这个库的模型和站点其余部分正好相反，接线前必须先说清楚它要什么：
 *
 *   它不生成「效果层」，而是把 root 的**直接子节点**光栅化成一张离屏画布，
 *   再按玻璃元素的形状跑 WebGL 片元着色器（折射、色散、Fresnel、倒角高光），
 *   把结果画进玻璃元素内部注入的 <canvas> 里。
 *
 *   两条硬约束：玻璃元素必须是 root 的直接子元素；root 自己的 CSS 背景
 *   不参与采样，背景必须以子元素的形式存在。
 *
 * 而本站的面板是嵌套在 main/卡片网格里的，当不了 root 的直接子元素。
 * 所以这里不把面板本身交给库，而是给它**垫一块玻璃底板**：
 *
 *   .lab-lg-layer                     root：文档坐标、z-index:-1、不吃指针事件
 *     ├ img.lab-lg-bg                 场景：固定在视口上的背景图（复刻 background-attachment: fixed）
 *     ├ div.lab-lg-plate              ② 每块面板一枚，位置和尺寸对齐那块面板
 *     └ ...
 *
 *   ① <img> 走库的 drawImage 快速通道，不进 html-to-image 那套 SVG 光栅化。
 *   ② 底板画的是「这块面板位置上、背景被玻璃折射后」的样子。
 *      面板自己随后被 CSS 转成透明底（见 globals.css 的
 *      [data-lab-glass-plate="on"]），玻璃就透出来了，而面板里的文字
 *      仍然是活的 DOM，压在底板上，不受光栅化影响。
 *
 * 为什么是「一层底板」而不是「一块面板一个实例」：每个实例会开一个独立的
 * WebGL 上下文，浏览器上限只有十几个，而标签页那种页面几十块面板。
 * 一个实例 + N 个玻璃元素既能拿到同样的效果，也只需要一个上下文。
 *
 * 性能上这个架子有三处是必须的，都是实测出来的，改之前先看注释：
 *   1. 每块底板要自成层叠上下文（见 globals.css 的 .lab-lg-plate，
 *      否则 canvas 会被背景图盖住，效果根本不显示）；
 *   2. 滚动时必须主动让库重画，而且要节流 + 剔除屏幕外的；
 *   3. 面积太大、数量太多的面板不给玻璃。
 */

/** 面板上的标记：有了它 CSS 才把面板底转透明 */
const PLATE_ATTR = "data-lab-glass-plate";

/**
 * 每帧的像素预算（设备像素）。
 *
 * 这是整套开销的唯一硬约束：库的模糊缓冲是全分辨率的，一块玻璃每帧要跑
 * 6 次迭代 × 横竖两向 = 12 遍全尺寸写入，所以「玻璃总面积 × DPR²」基本就
 * 等于每帧要写多少纹素。3.2M 是桌面集成显卡上还撑得住的数量级。
 */
const PIXEL_BUDGET = 3_200_000;

/**
 * 按当前屏幕算这一轮实验的预算。
 *
 * 之所以要算而不是写死两个常数，是因为有两个反直觉的地方：
 *
 *   1. 手机的 CSS 视口小，但 DPR 通常是 2~3——同一块面板的设备像素是桌面的
 *      4~9 倍。所以「小屏就跑得动」是错的，小屏反而更该压数量；
 *   2. 竖屏手机一屏本来也塞不下几块面板，16 块的上限在那边等于没有限制。
 *
 * 于是：面积上限从「设备像素预算 ÷ DPR²」倒推（DPR 3 时只剩 355k CSS px，
 * 一块 390×844 的整屏面板就已经超了，不会给它上玻璃）；
 * 数量上限跟着视口面积走，小屏自动降到 4~6 块。
 */
function glassPlan() {
  const dpr = window.devicePixelRatio || 1;
  const viewportArea = window.innerWidth * window.innerHeight;

  return {
    // 一屏能放二十块面板的大屏才给到 16，手机上一屏大概只有 4 块
    maxPlates: Math.max(4, Math.min(16, Math.round(viewportArea / 120_000))),
    // 单块面积上限：比这个大的面板（长文正文那种）不给玻璃
    maxPlateArea: PIXEL_BUDGET / (dpr * dpr),
  };
}

/** 视口外这个距离以内的底板仍然算「看得见」，提前一点重画免得边缘露馅 */
const CULL_MARGIN = 240;

/**
 * 滚动时的重画间隔（毫秒）。
 *
 * 页面滚动是 60fps，玻璃按 60fps 全量重算就是「卡顿太明显」的根源；
 * 压到约 30fps 之后玻璃的滞后最多一帧多一点，肉眼看不出来，开销直接减半。
 * 停手之后会再补一次，保证最终画面是准的。
 */
const REDRAW_INTERVAL = 32;

/**
 * 两套玻璃参数，直接对应演示页（liquid-glass.ybouane.com）上的预设：
 *
 *   浅色 = Regular Glass        演示：{ cornerRadius: 40, blurAmount: 0 }
 *   深色 = Dark Glass           演示：{ brightness: -0.3, cornerRadius: 40, blurAmount: 0.4 }
 *
 * 除了 blurAmount / brightness，其余一律用库的默认值——「Regular glass」
 * 本来就是默认值加一个圆角，自己另调一套 refraction / specular 只会跑偏。
 *
 * floating 必须是 false：演示页那几块是给人拖玩的浮板，站点面板要跟着文档走。
 * shadowOpacity 也用默认的 0.3：面板浮在背景图上，需要那圈投影站稳。
 */
const GLASS_BY_THEME: Record<"light" | "dark", Partial<GlassConfig>> = {
  light: {
    // Regular Glass 一点不糊。这里「略加模糊」到 0.4：
    // 面板是要托住正文的，完全不糊时文字直接骑在背景的明暗交界上。
    blurAmount: 0.4,
    brightness: 0,
    floating: false,
  },
  dark: {
    // Dark Glass 的 brightness: -0.3 是这套预设的主角：
    // 深色主题的背景图偏亮、有霓虹块，面板压暗之后正文才读得清。
    // 模糊同样按需求从 0.4 加到 0.6。
    blurAmount: 0.6,
    brightness: -0.3,
    floating: false,
  },
};

/** 取当前主题该用的那套参数。data-theme 缺失时按浅色兜底（和主题脚本一致） */
function presetForTheme(): Partial<GlassConfig> {
  return document.documentElement.dataset.theme === "dark"
    ? GLASS_BY_THEME.dark
    : GLASS_BY_THEME.light;
}

/**
 * 读当前主题的背景图地址。
 *
 * 不写死文件名：主题令牌是唯一来源（浅色 + 两份深色块各一套），
 * 背景图以后换名字或换图，这里跟着走。
 */
function currentBackgroundUrl(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--bg-image")
    .trim();
  const match = /url\((.*?)\)/.exec(raw);
  if (!match) return "";
  return match[1].trim().replace(/^["']|["']$/g, "");
}

/**
 * 单块底板的配置：主题预设 + 这块面板自己的圆角和倒角。
 *
 * 圆角不能照抄演示页的 40：演示页那几块是固定尺寸的浮板，而本站面板的圆角
 * 跟着 --radius-panel 走（「圆角」那个实验还能把它改成 0 或 26）。
 * 底板必须和面板的圆角一致，否则玻璃的四角会露出或盖住面板的边。
 */
function plateConfig(radius: number, width: number, height: number) {
  /*
    倒角深度（zRadius）必须跟着面板的厚度走，不能照抄演示页的 40。

    倒角是「玻璃有多厚」：它从每条边向内铺开 zRadius 像素。演示页那几块浮板
    高约 80、宽约 300，40 的倒角刚好是一块厚玻璃；而本站顶栏只有 57 高，
    上下两条 40 的倒角会在中间撞上——法线在那里翻向，画面上就是一条
    「被劈了一刀」的接缝。

    取 min(宽,高)/4 封顶 40：57 高的顶栏得到 14（两条倒角互不重叠），
    大面板仍然拿到 40 的厚玻璃感。
  */
  const zRadius = Math.max(6, Math.min(40, Math.round(Math.min(width, height) / 4)));
  return { ...presetForTheme(), cornerRadius: radius, zRadius };
}

export function LiquidGlassBackground() {
  const layerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  // 换页时面板整套换掉，底板必须重新量。用 pathname 依赖最直接：
  // 路由一变就整段重建，不用去猜哪些 DOM 变了
  const pathname = usePathname();

  useEffect(() => {
    const layer = layerRef.current;
    const image = imageRef.current;
    if (!layer || !image) return;

    const html = document.documentElement;
    let disposed = false;
    let instance: LiquidGlass | null = null;
    let plates: HTMLDivElement[] = [];
    let panels: HTMLElement[] = [];

    setLabRuntimeStatus("liquidglass", "loading");

    /** 按当前主题换图。图没解码完就初始化的话，着色器采样到的是一张空图 */
    const syncSource = async () => {
      const url = currentBackgroundUrl();
      if (!url || image.currentSrc.endsWith(url)) return;
      image.src = url;
      try {
        await image.decode();
      } catch {
        // 解码失败就让它空着：着色器采样到空白，页面其余部分不受影响
      }
    };

    const clearPlates = () => {
      for (const panel of panels) panel.removeAttribute(PLATE_ATTR);
      for (const plate of plates) plate.remove();
      plates = [];
      panels = [];
    };

    /**
     * 把一块面板的几何写进它的底板。
     *
     * 位置用**文档坐标**，所以底板和面板在同一个坐标系里一起滚，
     * 滚动时不需要重算位置。只有吸顶/固定定位的面板是例外：
     * 它们的位置本来就是视口坐标，底板也跟着固定在视口上。
     */
    const placePlate = (plate: HTMLDivElement, panel: HTMLElement) => {
      const rect = panel.getBoundingClientRect();
      const style = getComputedStyle(panel);
      const anchored = style.position === "sticky" || style.position === "fixed";
      const radius = parseFloat(style.borderTopLeftRadius) || 0;

      plate.style.position = anchored ? "fixed" : "absolute";
      plate.style.left = `${rect.left + (anchored ? 0 : window.scrollX)}px`;
      plate.style.top = `${rect.top + (anchored ? 0 : window.scrollY)}px`;
      plate.style.width = `${rect.width}px`;
      plate.style.height = `${rect.height}px`;
      plate.style.borderRadius = style.borderRadius;
      plate.dataset.config = JSON.stringify(plateConfig(radius, rect.width, rect.height));
    };

    /** 按当前 DOM 里的面板量一批底板。预算按当前屏幕算，见 glassPlan */
    const buildPlates = () => {
      clearPlates();

      const plan = glassPlan();
      const found = [...document.querySelectorAll<HTMLElement>(".panel")].filter(
        (el) => !layer.contains(el),
      );

      for (const panel of found.slice(0, plan.maxPlates)) {
        const rect = panel.getBoundingClientRect();
        // 还没排版（或者被折叠）的元素量出来是 0，给它一块 0×0 的底板没有意义
        if (rect.width < 8 || rect.height < 8) continue;
        // 太大的面板不给玻璃，理由见 glassPlan
        if (rect.width * rect.height > plan.maxPlateArea) continue;

        const plate = document.createElement("div");
        plate.className = "lab-lg-plate";
        placePlate(plate, panel);
        layer.append(plate);
        plates.push(plate);
        panels.push(panel);
      }
    };

    /** 建这批底板时的视口。resize 时用它判断「小抖动」还是「换了环境」 */
    let builtFor = { w: 0, h: 0, dpr: 1 };

    const teardown = () => {
      delete layer.dataset.ready;
      instance?.destroy();
      instance = null;
      clearPlates();
    };

    /** 全套重建：换页、初始化失败回滚时走这里 */
    const start = async () => {
      teardown();
      await syncSource();
      if (disposed) return;

      buildPlates();
      if (plates.length === 0) {
        // 没有面板可垫就没有效果可言，不必去开一个 WebGL 上下文
        setLabRuntimeStatus("liquidglass", "failed");
        return;
      }

      try {
        const { LiquidGlass } = await import("@ybouane/liquidglass");
        if (disposed) return;

        instance = await LiquidGlass.init({
          root: layer,
          glassElements: plates,
          // 默认值也按当前主题给一份：每块底板的 data-config 已经带了完整参数，
          // 这里是初始化阶段的兜底
          defaults: presetForTheme(),
        });

        // init 是异步的，await 期间用户可能已经关掉开关、或者换了页
        if (disposed) {
          teardown();
          return;
        }

        /*
          面板转透明这一步放在初始化成功之后，是这次接线里最要紧的顺序：
          先转透明再初始化，一旦库抛错（没有 WebGL、上下文被回收），
          面板就变成「没有底的文字压在背景图上」——试验性代码绝不能
          把页面弄成不可读的样子。
        */
        for (const panel of panels) panel.setAttribute(PLATE_ATTR, "on");
        layer.dataset.ready = "on";
        builtFor = {
          w: window.innerWidth,
          h: window.innerHeight,
          dpr: window.devicePixelRatio || 1,
        };
        setLabRuntimeStatus("liquidglass", "ready");
      } catch (error) {
        console.warn("[lab] 液态玻璃初始化失败：", error);
        teardown();
        setLabRuntimeStatus("liquidglass", "failed");
      }
    };

    /** 把所有底板的参数换成当前主题的预设，保留各自的几何 */
    const syncPlateConfigs = () => {
      for (const plate of plates) {
        const config = plate.dataset.config;
        if (!config) continue;
        const parsed = JSON.parse(config) as { cornerRadius?: number };
        const rect = plate.getBoundingClientRect();
        plate.dataset.config = JSON.stringify(
          plateConfig(parsed.cornerRadius ?? 0, rect.width, rect.height),
        );
      }
    };

    /**
     * 把底板的几何重新量一遍（内容或窗口变化之后）。
     *
     * 底板的位置是初始化那一刻量下来的，而面板的高度会随内容变化
     * （最典型的是这一行自己的状态文案：出现「已生效」之后它所属的面板
     * 长高一行，后面所有面板整体下移）。不重新量，玻璃就停在旧位置，
     * 看上去像整块错位。
     */
    const syncGeometry = () => {
      plates.forEach((plate, index) => {
        const panel = panels[index];
        if (!panel || !panel.isConnected) return;
        placePlate(plate, panel);
      });
    };

    /**
     * 只让「看得见的」底板重画。
     *
     * 库自己不做视口裁剪，而且 markChanged() 不带参数等于「把**所有**玻璃
     * 标脏」——包括在屏幕外几屏的那些，长页面上那部分纯属白烧。
     * 传元素进去，库只会重画与它相交的那几块。
     */
    const markVisibleChanged = () => {
      if (!instance) return;
      const height = window.innerHeight;
      for (const plate of plates) {
        const rect = plate.getBoundingClientRect();
        if (rect.bottom < -CULL_MARGIN || rect.top > height + CULL_MARGIN) continue;
        instance.markChanged(plate);
      }
    };

    /*
      滚动必须主动触发重画，这一条是这个实验能不能用起来的关键。

      站点背景是 background-attachment: fixed（钉在视口上），而底板跟着文档走：
      滚动时底板相对背景移动了，采样区域整个变了。库自己发现不了这件事
      （它盯的是元素在 root 内有没有动，而底板和面板在 root 内是一起滚的），
      结果就是底板里的画面停在滚动之前，看上去是「一块贴在旧位置上的玻璃」。

      实测：不补这一手时，三个滚动位置下同一块底板 canvas 的平均亮度
      一模一样（20/28/71/144），说明它压根没重画过。

      代价是每滚动一帧就要重算一遍玻璃，所以这里按 REDRAW_INTERVAL 节流；
      最后再补一次（scroll 事件会停，节流丢掉的最后一帧得自己补回来）。
    */
    let scrollScheduled = false;
    let lastRedrawAt = 0;
    let scrollSettleTimer = 0;

    const onScroll = () => {
      if (disposed) return;

      const now = performance.now();
      if (!scrollScheduled && now - lastRedrawAt >= REDRAW_INTERVAL) {
        scrollScheduled = true;
        requestAnimationFrame(() => {
          scrollScheduled = false;
          lastRedrawAt = performance.now();
          if (!disposed) markVisibleChanged();
        });
      }

      window.clearTimeout(scrollSettleTimer);
      scrollSettleTimer = window.setTimeout(() => {
        if (!disposed) markVisibleChanged();
      }, 140);
    };

    /*
      内容撑高/收短也要重算几何：状态文案出现、字体换行、图片加载完
      都会让面板移动，而这些东西没有事件可听，只能观察尺寸。
    */
    let layoutScheduled = false;
    const onLayoutChange = () => {
      if (layoutScheduled || disposed) return;
      layoutScheduled = true;
      requestAnimationFrame(() => {
        layoutScheduled = false;
        if (disposed) return;
        syncGeometry();
        markVisibleChanged();
      });
    };
    const sizeObserver = new ResizeObserver(onLayoutChange);

    /*
      换主题要做三件事：换成另一张背景图（深浅两张不是同一张）、
      把底板参数换成对应主题的预设、让着色器重画一遍。

      这里刻意不整套重建：重建要销毁再开一个 WebGL 上下文，切换时能卡住
      一两秒；而库的 data-config 是会被重新读取的（它对每个玻璃元素挂着
      attributeFilter: ["data-config"] 的观察器），改属性就够。
    */
    const themeObserver = new MutationObserver(() => {
      void (async () => {
        await syncSource();
        syncPlateConfigs();
        markVisibleChanged();
      })();
    });

    /*
      窗口尺寸变化分两种，处理方式不一样：

      - 小抖动（拖一下窗口、滚动条出现）：ResizeObserver 已经负责重算几何，
        这里只要让库重新采样；
      - 大变化（换设备、手机旋转、改浏览器缩放）：底板数量和面积预算都该重算，
        得整套重建。判据是宽或高变化超过两成，或者 DPR 变了（缩放/换屏）。

      阈值不再细：重建要销毁再开一个 WebGL 上下文，代价远大于这几帧的观感。
    */
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (disposed) return;
        const dpr = window.devicePixelRatio || 1;
        const dw = Math.abs(window.innerWidth - builtFor.w) / Math.max(builtFor.w, 1);
        const dh = Math.abs(window.innerHeight - builtFor.h) / Math.max(builtFor.h, 1);
        if (dw > 0.2 || dh > 0.2 || dpr !== builtFor.dpr) {
          void start();
          return;
        }
        syncGeometry();
        markVisibleChanged();
      }, 250);
    };

    void start();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    sizeObserver.observe(document.body);
    themeObserver.observe(html, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      disposed = true;
      window.clearTimeout(scrollSettleTimer);
      window.clearTimeout(resizeTimer);
      themeObserver.disconnect();
      sizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      teardown();
      setLabRuntimeStatus("liquidglass", "idle");
    };
  }, [pathname]);

  return (
    <div className="lab-lg-layer" aria-hidden="true" ref={layerRef}>
      {/* src 由 effect 按主题写入：静态导出的 HTML 里写死任何一张，
          都会在另一种主题下先闪一下错的那张 */}
      {/* eslint-disable-next-line @next/next/no-img-element --
          这不是内容图片，是着色器的输入：库要拿到一个真 <img> 才能走
          drawImage 的快速通道（next/image 的输出会被它当成普通 DOM 去跑
          html-to-image 光栅化，又慢又可能被改写 src）。它铺满视口且
          aria-hidden，不承担任何语义。 */}
      <img className="lab-lg-bg" alt="" ref={imageRef} />
    </div>
  );
}
