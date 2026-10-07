import { getTableOfContents, getReadingTime, getAllPosts } from "@/lib/posts";

/**
 * 目录锚点必须和 rehype-slug 渲染出来的 id 完全一致，
 * 否则文章目录点击跳转会失效。这个一致性靠两边使用同一个
 * github-slugger 保证，这里用真实渲染的 HTML 做回归验证。
 */

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ""}`);
  }
}

async function main() {
  // 拿到 dev server 渲染出的真实 id
  const base = process.env.BASE_URL ?? "http://localhost:3000";
  let reachable = true;
  try {
    await fetch(`${base}/blog/nextjs-16-breaking-changes`, { cache: "no-store" });
  } catch {
    reachable = false;
  }

  if (reachable) {
    console.log("目录锚点一致性（对比真实渲染的 HTML）");
    const html = await (
      await fetch(`${base}/blog/nextjs-16-breaking-changes`, { cache: "no-store" })
    ).text();

    const renderedIds = [...html.matchAll(/<h[23][^>]*\sid="([^"]+)"/g)].map(
      (m) => m[1],
    );
    const tocIds = getTableOfContents("nextjs-16-breaking-changes").map((i) => i.id);

    check(
      "提取到的 id 数量与页面一致",
      renderedIds.length === tocIds.length,
      `页面: ${renderedIds.length} 个, 目录: ${tocIds.length} 个`,
    );

    for (const id of tocIds) {
      check(`目录锚点存在于页面: ${id}`, renderedIds.includes(id));
    }

    // 含行内代码的标题：两边都要基于剥离后的纯文本算 slug
    check(
      "含行内代码的标题 slug 正确",
      tocIds.includes("1-params-和-searchparams-变成了-promise"),
      `实际得到: ${tocIds.join(", ")}`,
    );
  } else {
    console.log("跳过锚点一致性检查（dev server 未运行）");
  }

  console.log("\n目录解析");
  const toc = getTableOfContents("hello-world");
  check("能提取到目录", toc.length > 0);
  check("不包含 h1（标题由页头渲染）", toc.every((i) => i.depth >= 2));
  check(
    "中文标题 id 保留中文",
    toc.some((i) => i.text === "技术栈" && i.id === "技术栈"),
  );

  console.log("\n代码块内的 # 不会被误判为标题");
  // hello-world.mdx 的 bash 代码块里有一行 "# 启动本地开发服务器"
  check(
    "跳过了代码块内的井号注释",
    !toc.some((i) => i.text.includes("启动本地开发服务器")),
    `实际目录: ${toc.map((i) => i.text).join(" / ")}`,
  );

  console.log("\n阅读时长");
  check("短文本至少 1 分钟", getReadingTime("短") === 1);
  check(
    "长中文文本时长合理",
    getReadingTime("字".repeat(400)) === 1 && getReadingTime("字".repeat(800)) === 2,
  );

  console.log("\n草稿过滤");
  check("文章列表非空", getAllPosts().length > 0);
  check("不含 draft 文章", getAllPosts().every((p) => !p.draft));

  console.log(`\n结果: ${passed} 通过, ${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
}

main();