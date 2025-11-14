// functions/manage/list.js
// 列出所有已上传记录（从 KV: FILE_KV 读取）

export async function onRequest({ env }) {
  if (!env.FILE_KV) {
    return new Response(
      JSON.stringify({ ok: false, error: "FILE_KV not bound" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { keys } = await env.FILE_KV.list();
  const items = [];

  for (const k of keys) {
    const v = await env.FILE_KV.get(k.name);
    if (!v) continue;
    try {
      items.push(JSON.parse(v));
    } catch {
      // ignore broken json
    }
  }

  // 按时间倒序
  items.sort((a, b) => (b.time || 0) - (a.time || 0));

  return new Response(JSON.stringify({ ok: true, items }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
