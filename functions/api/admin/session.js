/**
 * 当前登录态查询。
 *
 *   GET /api/admin/session   → { authenticated: boolean }
 *
 * 单独开一个轻接口，是为了让后台页面在加载时用最便宜的方式判断
 * 「该显示管理界面还是跳回登录页」，不必先拉一次完整数据列表。
 * 它不泄露任何信息——只回答「这个 Cookie 有效吗」。
 */

import { adminJson, hasSession, sessionClearCookie } from "../../_lib/api.js";

export async function onRequestGet({ request, env }) {
  const authenticated = await hasSession(request, env || {});
  return adminJson({ authenticated });
}

/** DELETE 走退出登录：清掉 Cookie 即失效（签名方案下服务端无需记账） */
export async function onRequestDelete({ request }) {
  return adminJson({ ok: true }, 200, {
    "set-cookie": sessionClearCookie(new URL(request.url)),
  });
}
