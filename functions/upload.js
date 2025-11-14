// functions/upload.js
export async function onRequestPost({ request, env }) {
  try {
    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(JSON.stringify({ ok: false, error: "Bad content type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 读取文件
    const form = await request.formData();
    const file = form.get("file");

    if (!file || typeof file === "string") {
      return new Response(JSON.stringify({ ok: false, error: "No file" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ⭐ 用 sendDocument (支持任意文件 & 大文件)
    const tgForm = new FormData();
    tgForm.append("chat_id", env.TG_Chat_ID);
    tgForm.append("document", file, file.name || "file");

    const tgResp = await fetch(
      `https://api.telegram.org/bot${env.TG_Bot_Token}/sendDocument`,
      { method: "POST", body: tgForm }
    );

    const data = await tgResp.json();
    if (!data.ok) {
      console.error("Telegram sendDocument error:", data);
      return new Response(JSON.stringify({ ok: false, error: "Telegram failed", data }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 这里是 Telegram 返回的文件信息（document 对象）
    const doc = data.result.document;

    const file_id = doc.file_id;
    const file_name = doc.file_name || "file";
    const ext = file_name.includes(".") ? file_name.split(".").pop() : "bin";

    const origin = new URL(request.url).origin;
    const fileUrl = `${origin}/file/${file_id}.${ext}`;

    return new Response(JSON.stringify({
      ok: true,
      file_id,
      file_name,
      url: fileUrl,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
                                       }      headers: { "Content-Type": "application/json" }
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
