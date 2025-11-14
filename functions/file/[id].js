// functions/file/[id].js
export async function onRequest({ params, env }) {
  try {
    const raw = params.id || "";
    const file_id = raw.split(".")[0];  // 去掉扩展名

    // getFile API -> 获得 file_path
    const info = await fetch(
      `https://api.telegram.org/bot${env.TG_Bot_Token}/getFile?file_id=${file_id}`
    );
    const j = await info.json();

    if (!j.ok) {
      return new Response("File not found", { status: 404 });
    }

    const file_path = j.result.file_path;

    // 下载文件内容
    const tgFileResp = await fetch(
      `https://api.telegram.org/file/bot${env.TG_Bot_Token}/${file_path}`
    );

    const buf = await tgFileResp.arrayBuffer();
    const contentType = tgFileResp.headers.get("Content-Type") || "application/octet-stream";

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",     // ⭐ 允许浏览器直接打开视频/PDF/图片
        "Cache-Control": "public, max-age=31536000",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response("Internal error " + err.message, { status: 500 });
  }
}
