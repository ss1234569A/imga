export async function onRequest({ request, env, params }) {
  try {
    const rawId = params.id || "";
    const fileId = rawId.split(".")[0];

    if (!fileId) {
      return new Response("Bad Request", { status: 400 });
    }

    // 1. 先调用 getFile 获取路径
    const infoResp = await fetch(
      `https://api.telegram.org/bot${env.TG_BOT_Token}/getFile?file_id=${fileId}`
    );
    const infoData = await infoResp.json();

    if (!infoData.ok || !infoData.result.file_path) {
      return new Response("File not found", { status: 404 });
    }

    const filePath = infoData.result.file_path;

    // 2. 下载 Telegram 文件
    const fileResp = await fetch(
      `https://api.telegram.org/file/bot${env.TG_Bot_Token}/${filePath}`
    );
    const buf = await fileResp.arrayBuffer();
    const contentType = fileResp.headers.get("Content-Type") || "image/jpeg";

    // 3. 返回文件 —— 强制 inline（覆盖 Telegram 自带的 attachment）
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline; filename=\"image.jpg\"",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response("Internal error", { status: 500 });
  }
}
