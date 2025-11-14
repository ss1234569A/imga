// functions/upload.js

export async function onRequestPost({ request, env }) {
  try {
    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({ ok: false, error: "Content-Type must be multipart/form-data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return new Response(
        JSON.stringify({ ok: false, error: "No file field in form-data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 发送到 Telegram Channel
    const tgForm = new FormData();
    tgForm.append("chat_id", env.TG_Chat_ID);
    // 这里用 sendPhoto，你也可以改成 sendDocument
    tgForm.append("photo", file, file.name || "image.jpg");

    const tgResp = await fetch(
      `https://api.telegram.org/bot${env.TG_Bot_Token}/sendPhoto`,
      {
        method: "POST",
        body: tgForm,
      }
    );

    const tgData = await tgResp.json();

    if (!tgData.ok) {
      console.error("Telegram sendPhoto error:", tgData);
      return new Response(
        JSON.stringify({ ok: false, error: "Telegram sendPhoto failed", detail: tgData }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 拿到最大尺寸的那张 photo
    const photos = tgData.result.photo;
    const lastPhoto = photos[photos.length - 1];
    const fileId = lastPhoto.file_id;

    const origin = new URL(request.url).origin;
    const fileUrl = `${origin}/file/${fileId}.jpg`;

    return new Response(
      JSON.stringify({
        ok: true,
        file_id: fileId,
        url: fileUrl,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("upload error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal error", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
