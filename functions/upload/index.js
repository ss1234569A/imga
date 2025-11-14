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
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return new Response("file 字段缺失", { status: 400 });
    }

    // Telegra.ph 文件大小限制大约 5 MB
    if (file.size > 5 * 1024 * 1024) {
      return new Response("文件过大（建议 <5MB）", { status: 413 });
    }

    // ⭐⭐ 关键：确保 file 一定有 MIME（否则 Telegra.ph 400 Unknown error）
    const fixedBlob = file.type
      ? file
      : new Blob([await file.arrayBuffer()], { type: "image/jpeg" });

    const uploadForm = new FormData();
    uploadForm.append("file", fixedBlob, file.name || "image.jpg");

    const teleResp = await fetch("https://graph.org/upload", {
      method: "POST",
      body: uploadForm,
    });

    if (!teleResp.ok) {
      const txt = await teleResp.text();
      return new Response(
        `Telegra.ph 上传失败: ${teleResp.status}\n${txt}`,
        { status: 500 }
      );
    }

    const teleJson = await teleResp.json();
    if (!Array.isArray(teleJson) || !teleJson[0]?.src) {
      return new Response(
        "Telegra.ph 返回格式异常：" + JSON.stringify(teleJson),
        { status: 500 }
      );
    }

    const src = teleJson[0].src;
    const fileName = src.split("/").pop();

    const url = new URL(request.url);
    const publicUrl = `${url.origin}/i/${fileName}`;

    const respBody = {
      ok: true,
      src,
      fileName,
      url: publicUrl,
    };

    return new Response(JSON.stringify(respBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response("服务器错误：" + err.message, { status: 500 });
  }
}
