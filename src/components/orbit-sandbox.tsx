"use client";

import { useEffect, useRef } from "react";
import styles from "./orbit-sandbox.module.css";

/*
  首页 Hero 的轨道沙盒：
  - 中心是玻璃质感的核心球（DOM + CSS 令牌，主题自适应）；
  - 按住拖拽发射卫星（方向 = 拖拽方向，速度 = 拖拽距离），拖拽时实时绘制
    引力弯曲的预测轨迹；轻点一下则在落点直接生成一颗恰好圆轨道的卫星；
  - 悬停时鼠标是一个弱引力源，可以把卫星的轨道牵偏；
  - 卫星坠入核心会被吞掉（核心弹一下、放出一圈涟漪）；越过画布边界则
    在边界处原地消散（本体冻结淡出、轨迹回缩），不会绕椭圆飘回来；
    卫星数量有上限，超出时最老的一颗自动退场，全场清空几秒后自动补一组。
  全部动态绘制在 <canvas> 上，配色实时取自主题令牌（--accent / --border），
  深浅色、赛博朋克、书本模式切换时自动跟随。
  prefers-reduced-motion 下不启动物理，渲染一张静止的轨道图。
  坐标系一律以画布中心为原点，窗口缩放时卫星相对位置不变。
*/

const CORE_R = 52; // 核心捕获半径（px）：玻璃球直径 6.25rem ≈ 100px，略留边
const GM = 9e5; // 核心引力参数
const MOUSE_GM = GM * 0.26; // 鼠标引力源的引力参数（弱，只够牵偏轨道）
const SOFT = 18; // 引力软化半径（px），防止近点数值爆炸
const MAX_SPEED = 320; // 发射速度上限（px/s）
const LAUNCH_GAIN = 3.2; // 拖拽距离 → 初速度的放大系数
const MAX_SATS = 9; // 同时在场的卫星上限
const TRAIL_MAX = 70; // 每颗卫星轨迹保留的点数
const GUIDE_R = 140; // 参考轨道虚线半径
const TRAIL_ALPHA = 0.45; // 轨迹尾部峰值透明度
const DISSOLVE_MS = 480; // 越界消散时长
const PREDICT_DT = 1 / 240; // 预测积分步长，与真实物理的标称子步一致（60Hz 每帧四子步）
const PREDICT_STEPS = 1200; // 预测步数，约 5 秒前瞻
const PREDICT_EVERY = 20; // 每隔多少步落一个预测点（约 60 个点）
const MOUSE_GRACE_MS = 1200; // 用户发射后鼠标引力的豁免期，保证发射初段与预测轨迹一致
const STAR_COUNT = 20; // 背景闪烁星点数量（点缀用，宁少勿多）

type Sat = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: number[]; // 扁平的 x,y 序列
  dying?: number; // 越界消散的开始时刻，存在即处于消散中
};

type Ripple = { x: number; y: number; born: number };

type Palette = { accent: string; border: string };

// 背景闪烁星点
type Star = {
  x: number; // 相对画布中心的坐标
  y: number;
  r: number;
  phase: number;
  speed: number; // 闪烁角速度（rad/s）
  base: number; // 基础透明度峰值
};

// mulberry32：确定性伪随机，保证同尺寸下星点布局稳定
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function OrbitSandbox() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const core = coreRef.current;
    const hint = hintRef.current;
    if (!wrap || !canvas || !core || !hint) return;
    const ctxMaybe = canvas.getContext("2d");
    if (!ctxMaybe) return;
    // 别名收窄：下面 drawGuide/drawStatic 用函数声明（提升），TS 不会把
    // !ctx 判空的收窄带进提升后的函数体，这里直接把非空类型定死。
    const ctx: CanvasRenderingContext2D = ctxMaybe;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---------- 尺寸 / 主题配色 ----------
    let W = 0;
    let H = 0;
    let palette: Palette = { accent: "#7c9cff", border: "#d8d8e0" };
    let stars: Star[] = [];
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars();
      if (reduced) drawStatic();
    };
    resize();

    const readPalette = () => {
      const cs = getComputedStyle(document.documentElement);
      palette = {
        accent: cs.getPropertyValue("--accent").trim() || palette.accent,
        border: cs.getPropertyValue("--border").trim() || palette.border,
      };
      if (reduced) drawStatic(); // 循环未启动时也要立即反映新配色
    };
    readPalette();
    // 监听 html 属性变化：data-theme / 实验室开关等，切换即重取令牌
    const themeObserver = new MutationObserver(readPalette);
    themeObserver.observe(document.documentElement, { attributes: true });

    // ---------- 物理状态 ----------
    const sats: Sat[] = [];
    const ripples: Ripple[] = [];
    const mouse = { x: 0, y: 0, inside: false };
    const aim = { active: false, ax: 0, ay: 0, x: 0, y: 0 };
    let coreBumpTimer = 0;
    let raf = 0;
    let running = false;
    let lastT = 0;
    let inView = true;
    let emptySince = 0; // 场上没有卫星的起始时刻，0 表示非空
    let mouseGraceUntil = 0; // 此时刻之前鼠标引力不生效（用户发射后的豁免期）

    const toCenter = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left - W / 2, y: e.clientY - rect.top - H / 2 };
    };

    const clampSpeed = (v: { vx: number; vy: number }) => {
      const sp = Math.hypot(v.vx, v.vy);
      if (sp > MAX_SPEED) {
        v.vx *= MAX_SPEED / sp;
        v.vy *= MAX_SPEED / sp;
      }
    };

    const spawn = (x: number, y: number, vx: number, vy: number, byUser: boolean) => {
      const v = { vx, vy };
      clampSpeed(v);
      sats.push({ x, y, vx: v.vx, vy: v.vy, trail: [] });
      if (sats.length > MAX_SATS) sats.shift();
      if (byUser) {
        hint.dataset.done = "1"; // 发射过一次就收起操作提示
        // 松手后瞄准态解除，鼠标弱引力会立刻接管；给一段豁免期，
        // 否则实际轨迹从第一帧起就比预测弯（预测不含鼠标引力）。
        mouseGraceUntil = performance.now() + MOUSE_GRACE_MS;
      }
    };

    // 在 (x, y) 处恰好圆轨道的速度（逆时针切向）
    const circularVelocity = (x: number, y: number) => {
      const r = Math.hypot(x, y) || 1;
      const v = Math.sqrt(GM / r);
      return { vx: (-y / r) * v, vy: (x / r) * v };
    };

    // 初始三颗卫星，让沙盒一进场就是活的；
    // 轨道半径都按画布高度收紧，保证稳定运行时不会碰到边界消散
    const seed = () => {
      const minHalf = Math.min(W, H) / 2;
      const place = (r: number, deg: number, factor: number) => {
        const a = (deg * Math.PI) / 180;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        const c = circularVelocity(x, y);
        spawn(x, y, c.vx * factor, c.vy * factor, false);
      };
      place(Math.min(GUIDE_R * 0.75, minHalf * 0.55), 205, 0.97); // 内圈轻微椭圆
      place(Math.min(GUIDE_R * 0.95, minHalf * 0.66), 330, 1.06); // 外圈椭圆
      place(guideR(), 60, 1); // 匀速圆轨道，正好骑在参考虚线上
    };

    // 参考虚线的实际半径：容器太窄时按画布收紧，避免虚线被上下裁掉
    function guideR() {
      return Math.min(GUIDE_R, Math.min(W, H) / 2 - 12);
    }

    const accel = (x: number, y: number, useMouse: boolean): [number, number] => {
      let ax = 0;
      let ay = 0;
      // 核心引力：GM * r_vec / (|r|² + soft²)^{3/2}
      let dx = -x;
      let dy = -y;
      let d2 = dx * dx + dy * dy + SOFT * SOFT;
      let f = GM / (d2 * Math.sqrt(d2));
      ax += dx * f;
      ay += dy * f;
      if (useMouse) {
        dx = mouse.x - x;
        dy = mouse.y - y;
        d2 = dx * dx + dy * dy + SOFT * SOFT * 4;
        f = MOUSE_GM / (d2 * Math.sqrt(d2));
        ax += dx * f;
        ay += dy * f;
      }
      return [ax, ay];
    };

    const bumpCore = () => {
      core.classList.remove(styles.coreBump);
      void core.offsetWidth; // 强制 reflow，让同一动画能连续重触发
      core.classList.add(styles.coreBump);
      window.clearTimeout(coreBumpTimer);
      coreBumpTimer = window.setTimeout(() => core.classList.remove(styles.coreBump), 520);
    };

    const step = (dt: number, now: number) => {
      const sub = 4; // 子步进，提高近心点积分精度，也收紧与预测轨迹的偏差
      const h = dt / sub;
      const useMouse = mouse.inside && !aim.active && now >= mouseGraceUntil; // 瞄准时不牵引、发射初段豁免，保证预测轨迹可信
      const borderX = W / 2 - 4;
      const borderY = H / 2 - 4;
      for (let i = sats.length - 1; i >= 0; i--) {
        const s = sats[i];
        if (s.dying !== undefined) {
          // 边界消散中：本体冻结在越界处淡出，轨迹向本体回缩
          if (now - s.dying > DISSOLVE_MS) {
            sats.splice(i, 1);
            continue;
          }
          if (s.trail.length > 0) s.trail.splice(0, Math.min(8, s.trail.length));
          continue;
        }
        for (let k = 0; k < sub; k++) {
          const [ax, ay] = accel(s.x, s.y, useMouse);
          s.vx += ax * h;
          s.vy += ay * h;
          s.x += s.vx * h;
          s.y += s.vy * h;
        }
        const r = Math.hypot(s.x, s.y);
        if (r < CORE_R + 4) {
          ripples.push({ x: s.x, y: s.y, born: now });
          bumpCore();
          sats.splice(i, 1);
          continue;
        }
        // 越过可见边界即开始消散：停在边界处淡出，而不是绕椭圆飘回来
        if (Math.abs(s.x) > borderX || Math.abs(s.y) > borderY) {
          s.dying = now;
          s.vx = 0;
          s.vy = 0;
          continue;
        }
        s.trail.push(s.x, s.y);
        if (s.trail.length > TRAIL_MAX * 2) s.trail.splice(0, s.trail.length - TRAIL_MAX * 2);
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (now - ripples[i].born > 550) ripples.splice(i, 1);
      }
      // 沙盒被清空几秒后自动补一组初始卫星，保持画面是活的
      if (sats.length === 0) {
        if (emptySince === 0) emptySince = now;
        else if (now - emptySince > 4000) {
          emptySince = 0;
          seed();
        }
      } else {
        emptySince = 0;
      }
    };

    // ---------- 绘制 ----------
    // 背景星点：少量、更淡，只做点缀。确定性布点，避开核心区。
    function makeStars() {
      const rand = mulberry32(20261012);
      const arr: Star[] = [];
      let guard = 0;
      while (arr.length < STAR_COUNT && guard++ < 200) {
        const x = (rand() * 2 - 1) * (W / 2 - 16);
        const y = (rand() * 2 - 1) * (H / 2 - 16);
        if (Math.hypot(x, y) < CORE_R + 26) continue;
        arr.push({
          x,
          y,
          r: 0.8 + rand() * 0.9,
          phase: rand() * Math.PI * 2,
          speed: 0.3 + rand() * 0.5,
          base: 0.1 + rand() * 0.14,
        });
      }
      stars = arr;
    }

    function drawStars(t: number) {
      ctx.fillStyle = palette.accent;
      for (const st of stars) {
        const twinkle = 0.55 + 0.45 * Math.sin((t / 1000) * st.speed + st.phase);
        ctx.globalAlpha = st.base * twinkle;
        ctx.beginPath();
        ctx.arc(W / 2 + st.x, H / 2 + st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function drawGuide() {
      const r = guideR();
      ctx.strokeStyle = palette.border;
      ctx.globalAlpha = 0.55;
      ctx.setLineDash([4, 8]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    const drawRipples = (now: number) => {
      if (ripples.length === 0) return;
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 2;
      for (const rp of ripples) {
        const age = Math.min((now - rp.born) / 550, 1);
        ctx.globalAlpha = (1 - age) * 0.7;
        ctx.beginPath();
        ctx.arc(W / 2 + rp.x, H / 2 + rp.y, CORE_R * 0.55 + age * 40, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const drawSatellite = (s: Sat, now: number) => {
      const fade = s.dying === undefined ? 1 : Math.max(0, 1 - (now - s.dying) / DISSOLVE_MS);
      if (fade <= 0) return;
      const t = s.trail;
      if (t.length >= 4) {
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 1.4;
        const n = t.length / 2;
        for (let i = 2; i < t.length; i += 2) {
          ctx.globalAlpha = (i / n) * TRAIL_ALPHA * fade;
          ctx.beginPath();
          ctx.moveTo(W / 2 + t[i - 2], H / 2 + t[i - 1]);
          ctx.lineTo(W / 2 + t[i], H / 2 + t[i + 1]);
          ctx.stroke();
        }
      }
      const x = W / 2 + s.x;
      const y = H / 2 + s.y;
      ctx.fillStyle = palette.accent;
      // 双层光晕 + 本体
      for (const [r, a] of [
        [11, 0.14],
        [7, 0.22],
      ] as const) {
        ctx.globalAlpha = a * fade;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = fade;
      ctx.beginPath();
      ctx.arc(x, y, 3.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const drawMouseWell = () => {
      if (!mouse.inside || aim.active) return;
      const x = W / 2 + mouse.x;
      const y = H / 2 + mouse.y;
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const drawAim = () => {
      const ax = W / 2 + aim.ax;
      const ay = H / 2 + aim.ay;
      const px = W / 2 + aim.x;
      const py = H / 2 + aim.y;
      const v = {
        vx: (aim.x - aim.ax) * LAUNCH_GAIN,
        vy: (aim.y - aim.ay) * LAUNCH_GAIN,
      };
      clampSpeed(v);
      // 预测轨迹：从锚点起以相同初速做前向积分，画出引力弯曲的路径。
      // 积分器与真实物理一致（半隐式欧拉），步长也取真实模拟的标称子步
      // （60Hz 下每帧两子步 ≈ 1/120s），否则长轨迹会和实际飞行明显分叉。
      let x = aim.ax;
      let y = aim.ay;
      const h = PREDICT_DT;
      const borderX = W / 2 - 4;
      const borderY = H / 2 - 4;
      ctx.fillStyle = palette.accent;
      for (let i = 0; i < PREDICT_STEPS; i++) {
        const [gx, gy] = accel(x, y, false);
        v.vx += gx * h;
        v.vy += gy * h;
        x += v.vx * h;
        y += v.vy * h;
        const r = Math.hypot(x, y);
        // 与真实物理一致的终止条件：坠核或碰到边界（那里会开始消散）
        if (r < CORE_R + 4 || Math.abs(x) > borderX || Math.abs(y) > borderY) break;
        if (i % PREDICT_EVERY === 0) {
          ctx.globalAlpha = 0.06 + 0.5 * (1 - i / PREDICT_STEPS);
          ctx.beginPath();
          ctx.arc(W / 2 + x, H / 2 + y, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // 瞄准线 + 箭头 + 锚点
      ctx.globalAlpha = 1;
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(px, py);
      ctx.stroke();
      const ang = Math.atan2(py - ay, px - ax);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - 8 * Math.cos(ang - 0.42), py - 8 * Math.sin(ang - 0.42));
      ctx.moveTo(px, py);
      ctx.lineTo(px - 8 * Math.cos(ang + 0.42), py - 8 * Math.sin(ang + 0.42));
      ctx.stroke();
      ctx.fillStyle = palette.accent;
      ctx.beginPath();
      ctx.arc(ax, ay, 3, 0, Math.PI * 2);
      ctx.fill();
    };

    const render = (now: number) => {
      ctx.clearRect(0, 0, W, H);
      drawStars(now);
      drawGuide();
      drawRipples(now);
      for (const s of sats) drawSatellite(s, now);
      drawMouseWell();
      if (aim.active) drawAim();
    };

    // prefers-reduced-motion：一张静止的轨道图（函数声明以便 resize 首调时已提升可用）
    function drawStatic() {
      ctx.clearRect(0, 0, W, H);
      drawStars(2400); // 固定时刻 → 静态中间透明度
      drawGuide();
      const minHalf = Math.min(W, H) / 2;
      const place = (r: number, deg: number) => {
        const a = (deg * Math.PI) / 180;
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.ellipse(W / 2, H / 2, r, r, 0, a - 0.9, a);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = palette.accent;
        ctx.beginPath();
        ctx.arc(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r, 3.1, 0, Math.PI * 2);
        ctx.fill();
      };
      place(Math.min(GUIDE_R * 0.75, minHalf * 0.55), 205);
      place(guideR(), 60);
    }

    // ---------- 主循环 / 生命周期 ----------
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((t - lastT) / 1000, 0.033);
      lastT = t;
      step(dt, t);
      render(t);
    };

    const start = () => {
      if (running || reduced || document.hidden) return;
      running = true;
      lastT = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver((entries) => {
      inView = entries[0]?.isIntersecting ?? true;
      if (inView) start();
      else stop();
    });
    io.observe(wrap);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (inView) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // ---------- 指针交互 ----------
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const p = toCenter(e);
      aim.active = true;
      aim.ax = p.x;
      aim.ay = p.y;
      aim.x = p.x;
      aim.y = p.y;
      mouse.x = p.x;
      mouse.y = p.y;
      mouse.inside = true;
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const p = toCenter(e);
      mouse.x = p.x;
      mouse.y = p.y;
      mouse.inside = true;
      if (aim.active) {
        aim.x = p.x;
        aim.y = p.y;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!aim.active) return;
      aim.active = false;
      const p = toCenter(e);
      const drag = Math.hypot(p.x - aim.ax, p.y - aim.ay);
      if (drag < 8) {
        // 轻点：在落点生成一颗恰好圆轨道的卫星（圆轨道必须完整落在画布内才不会立刻消散）
        const r = Math.hypot(p.x, p.y);
        if (r > CORE_R + 12 && r < Math.min(W, H) / 2 - 6) {
          const c = circularVelocity(p.x, p.y);
          spawn(p.x, p.y, c.vx, c.vy, true);
        }
      } else {
        // 拖拽：沿拖拽方向发射
        spawn(aim.ax, aim.ay, (p.x - aim.ax) * LAUNCH_GAIN, (p.y - aim.ay) * LAUNCH_GAIN, true);
      }
    };

    const onPointerLeave = () => {
      if (!aim.active) mouse.inside = false;
    };

    if (!reduced) {
      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("pointercancel", () => {
        aim.active = false;
      });
      canvas.addEventListener("pointerleave", onPointerLeave);
      seed();
      if (inView) start();
    } else {
      // 静态模式下禁掉指针交互、藏起操作提示
      canvas.style.pointerEvents = "none";
      hint.dataset.done = "1";
    }

    return () => {
      stop();
      window.clearTimeout(coreBumpTimer);
      io.disconnect();
      ro.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} className={styles.sandbox} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
      <div ref={coreRef} className={styles.core}>
        <svg className={styles.atom} viewBox="0 0 160 160" fill="none" role="presentation">
          <ellipse cx="80" cy="80" rx="62" ry="24" stroke="currentColor" strokeWidth="4" />
          <ellipse
            cx="80"
            cy="80"
            rx="62"
            ry="24"
            transform="rotate(60 80 80)"
            stroke="currentColor"
            strokeWidth="4"
          />
          <ellipse
            cx="80"
            cy="80"
            rx="62"
            ry="24"
            transform="rotate(120 80 80)"
            stroke="currentColor"
            strokeWidth="4"
          />
          <circle cx="80" cy="80" r="14" fill="currentColor" />
        </svg>
      </div>
      <span ref={hintRef} className={`${styles.hint} text-xs text-secondary`}>
        拖拽发射 · 轻点入轨 · 悬停牵引
      </span>
    </div>
  );
}
