// 路由：GET /i/:id
// 例如：/i/xxxxxx.jpg
export async function onRequest(context) {
  const { request, params } = context;
  const { id } = params;

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  // 拼出 Telegra.ph 的真实地址
  const teleUrl = `https://telegra.ph/file/${id}`;

  // 直接从 Telegra.ph 拉取文件
  const upstream = await fetch(teleUrl, {
    method: "GET",
  });

  if (!upstream.ok) {
    return new Response("Origin fetch failed: " + upstream.status, {
      status: upstream.status,
    });
  }

  const buf = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("Content-Type") || "image/jpeg";

  // 关键：强制 inline + 长缓存
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
