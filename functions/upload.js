// functions/upload.js
// 支持任意文件、批量上传，并将文件信息记录到 KV (FILE_KV)

export async function onRequestPost({ request, env }) {
  try {
    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Content-Type must be multipart/form-data",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const formData = await request.formData();

    // 支持批量：file 字段可能有多个
    let files = formData.getAll("file") || [];
    files = files.filter((f) => f && typeof f !== "string");

    if (!files.length) {
      return new Response(
        JSON.stringify({ ok: false, error: "No file provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 处理标签：tags 为逗号 / 中文逗号分隔
    let tags = [];
    const tagsRaw = formData.get("tags");
    if (tagsRaw && typeof tagsRaw === "string") {
      tags = tagsRaw
        .split(/[，,]/)
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const origin = new URL(request.url).origin;
    const results = [];

    for (const file of files) {
      const tgForm = new FormData();
      tgForm.append("chat_id", env.TG_Chat_ID);
      // ⭐ 使用 sendDocument，支持任意文件类型 & 大文件
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
        console.error("Telegram sendDocument error:", tgJson);
        // 某个文件失败就跳过，继续下一个
        continue;
      }

      const doc = tgJson.result.document;
      const fileId = doc.file_id;
      const fileName = doc.file_name || file.name || "file";
      const ext = fileName.includes(".")
        ? fileName.split(".").pop()
        : "";

      const url = `${origin}/file/${fileId}${ext ? "." + ext : ""}`;

      const record = {
        file_id: fileId,
        name: fileName,
        url,
        tags,
        size: doc.file_size || file.size || null,
        mime: file.type || null,
        time: Date.now(),
      };

      // 写入 KV
      if (env.FILE_KV) {
        await env.FILE_KV.put(fileId, JSON.stringify(record));
      }

      results.push(record);
    }

    if (!results.length) {
      return new Response(
        JSON.stringify({ ok: false, error: "All uploads failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 为了兼容你之前的前端：单文件时返回 file_id + url
    let body;
    if (results.length === 1) {
      body = {
        ok: true,
        file_id: results[0].file_id,
        url: results[0].url,
        file: results[0],
        files: results,
      };
    } else {
      body = {
        ok: true,
        files: results,
      };
    }

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("upload error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
      }
