export async function onRequestPost({ request, env }) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return new Response("No file", { status: 400 });
  }

  // 1. 转成二进制，避免被 Telegram 识别为 Photo
  const buf = await file.arrayBuffer();

  // ★★★ 关键：强制为 application/octet-stream，让 Telegram 当作普通文件
  const blob = new Blob([buf], {
    type: "application/octet-stream"
  });

  // 2. 构造 formData
  const tgForm = new FormData();
  tgForm.append("chat_id", env.TG_Chat_ID);
  tgForm.append("document", blob, file.name || "image.jpg");

  // 3. 发给 Telegram sendDocument
  const tgResp = await fetch(
    `https://api.telegram.org/bot${env.TG_Bot_Token}/sendDocument`,
    {
      method: "POST",
      body: tgForm,
    }
  );

  const tgData = await tgResp.json();

  // 4. 检查返回结构
  if (!tgData.ok || !tgData.result || !tgData.result.document) {
    return new Response(JSON.stringify(tgData, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const fileId = tgData.result.document.file_id;

  const origin = new URL(request.url).origin;

  return new Response(
    JSON.stringify({
      ok: true,
      file_id: fileId,
      url: `${origin}/file/${fileId}.jpg`,
      telegram: tgData   // ★ 可用于 debug，成功后可删掉
    }, null, 2),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
