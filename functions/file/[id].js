export async function onRequest(context) {
  const { request, env, params } = context;
  const fileId = params.id;

  // 1. 通过 getFile 获取真实 file_path
  const getFileUrl = `https://api.telegram.org/bot${env.TG_Bot_Token}/getFile?file_id=${fileId}`;
  const res = await fetch(getFileUrl);
  const json = await res.json();

  if (!json.ok) {
    return new Response("Invalid file_id", { status: 404 });
  }

  const filePath = json.result.file_path;

  // 2. 下载真实文件
  const fileUrl = `https://api.telegram.org/file/bot${env.TG_Bot_Token}/${filePath}`;
  const fileRes = await fetch(fileUrl);

  if (!fileRes.ok) {
    return new Response("File fetch error", { status: 404 });
  }

  // 3. 读取 content-type（可能是图片、视频等）
  const contentType = fileRes.headers.get("content-type") || "application/octet-stream";

  // 4. 以 inline 输出文件（浏览器预览）
  return new Response(await fileRes.arrayBuffer(), {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000",
      "content-disposition": "inline"
    }
  });
}
