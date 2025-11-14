export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    const tgForm = new FormData();
    tgForm.append("chat_id", env.TG_Chat_ID);

    // ★ 关键：改成 sendDocument 彻底解决 file not found
    tgForm.append("document", file, file.name || "image.jpg");

    const tgResp = await fetch(
      `https://api.telegram.org/bot${env.TG_Bot_Token}/sendDocument`,
      {
        method: "POST",
        body: tgForm,
      }
    );

    const tgData = await tgResp.json();
    if (!tgData.ok) {
      return new Response(JSON.stringify(tgData), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // ★ 关键：sendDocument 返回的是 document.file_id
    const fileId = tgData.result.document.file_id;

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
    return new Response(err.message, { status: 500 });
  }
}
