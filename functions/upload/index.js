// 路由：POST /upload
export async function onRequest(context) {
  const { request } = context;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return new Response("Content-Type must be multipart/form-data", { status: 400 });
  }

  try {
    // 读取前端上传的文件
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return new Response("file 字段缺失", { status: 400 });
    }

    // 简单做个大小限制（Telegra.ph 官方上限大约 5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response("文件过大，建议 < 5MB", { status: 413 });
    }

    // 构造发往 Telegra.ph 的表单
    const teleForm = new FormData();
    // 注意：这里字段名必须是 "file"
    teleForm.append("file", file, file.name || "image.jpg");

    const teleResp = await fetch("https://telegra.ph/upload", {
      method: "POST",
      body: teleForm,
    });

    if (!teleResp.ok) {
      const text = await teleResp.text();
      return new Response(
        "Telegra.ph 上传失败: " + teleResp.status + "\n" + text,
        { status: 500 }
      );
    }

    const teleJson = await teleResp.json();
    // 正常返回形如：[{"src":"/file/xxxxxx.jpg"}]
    if (!Array.isArray(teleJson) || !teleJson[0] || !teleJson[0].src) {
      return new Response(
        "Telegra.ph 返回格式不正确: " + JSON.stringify(teleJson),
        { status: 500 }
      );
    }

    const src = teleJson[0].src; // 例如 "/file/xxxxxx.jpg"
    const fileName = src.split("/").pop(); // 取 "xxxxxx.jpg"

    const url = new URL(request.url);
    const publicUrl = `${url.origin}/i/${fileName}`;

    const respBody = {
      ok: true,
      src,          // telegra.ph 的原始路径
      fileName,     // 我们提取的文件名
      url: publicUrl, // 你真正要使用的外链
    };

    return new Response(JSON.stringify(respBody), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response("服务器异常: " + err.message, { status: 500 });
  }
}
