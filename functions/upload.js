// functions/upload.js

export async function onRequestPost({ request, env }) {
  try {
    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Content-Type must be multipart/form-data",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 读取上传的文件
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return new Response(
        JSON.stringify({ ok: false, error: "file 字段缺失" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ⭐ 使用 sendDocument 支持任意文件（最大 2GB）
    const tgForm = new FormData();
    tgForm.append("chat_id", env.TG_Chat_ID);
    tgForm.append("document", file, file.name || "file");

    const tgResp = await fetch(
      `https://api.telegram.org/bot${env.TG_Bot_Token}/sendDocument`,
      {
        method: "POST",
        body: tgForm,
      }
    );

    const tgJson = await tgResp.json();

    if (!tgJson.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Telegram 上传失败",
          detail: tgJson,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const doc = tgJson.result.document;
    const file_id = doc.file_id;
    const file_name = doc.file_name || "file.bin";
    const ext = file_name.includes(".")
      ? file_name.split(".").pop()
      : "bin";

    const origin = new URL(request.url).origin;
    const url = `${origin}/file/${file_id}.${ext}`;

    return new Response(
      JSON.stringify({
        ok: true,
        file_id,
        file_name,
        url,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
