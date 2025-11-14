// functions/file/[id].js

export async function onRequest({ request, env, params }) {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const rawId = params.id || "";
    // 支持带后缀的形式：FILE_ID.jpg -> 只取前面那段
    const fileId = rawId.split(".")[0];

    if (!fileId) {
      return new Response("Bad Request", { status: 400 });
    }

    // 第一步：通过 getFile 拿 file_path
    const infoResp = await fetch(
      `https://api.telegram.org/bot${env.TG_Bot_Token}/getFile?file_id=${encodeURIComponent(
        fileId
      )}`
    );
    const infoData = await infoResp.json();

    if (!infoData.ok || !infoData.result || !infoData.result.file_path) {
      console.error("Telegram getFile error:", infoData);
      return new Response("File not found", { status: 404 });
    }

    const filePath = infoData.result.file_path;

    // 第二步：真正下载文件内容
    const fileResp = await fetch(
      `https://api.telegram.org/file/bot${env.TG_Bot_Token}/${filePath}`
    );

    if (!fileResp.ok) {
      console.error("Telegram file download error:", fileResp.status);
      return new Response("Upstream error", { status: 502 });
    }

    const buf = await fileResp.arrayBuffer();
    const contentType =
      fileResp.headers.get("Content-Type") || "image/jpeg";

    // ★ 关键：这里强制 Content-Disposition: inline，浏览器就不会自动下载了
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",                // 预览，而不是下载
        "Cache-Control": "public, max-age=31536000",    // CF 可长期缓存
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("file route error:", err);
    return new Response("Internal error", { status: 500 });
  }
}
