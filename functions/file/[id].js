// functions/file/[id].js
// 根据 file_id 从 Telegram 拉取真实文件，保持自动下载行为

export async function onRequest({ env, params }) {
  try {
    const rawId = params.id || "";
    const fileId = rawId.split(".")[0]; // 支持 xxx.mp4 这种写法，只取前半段

    if (!fileId) {
      return new Response("Bad Request", { status: 400 });
    }

    // 第一步：通过 getFile 获取 file_path
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

    // 第二步：下载真实文件
    const fileResp = await fetch(
      `https://api.telegram.org/file/bot${env.TG_Bot_Token}/${filePath}`
    );

    if (!fileResp.ok) {
      console.error("Telegram file download error:", fileResp.status);
      return new Response("Upstream error", { status: 502 });
    }

    const buf = await fileResp.arrayBuffer();
    const contentType =
      fileResp.headers.get("Content-Type") || "application/octet-stream";

    // ⭐ 保持自动下载：Content-Disposition: attachment
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "attachment",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (err) {
    console.error("file route error:", err);
    return new Response("Internal error", { status: 500 });
  }
  }
