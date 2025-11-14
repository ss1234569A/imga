// functions/upload.js

export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("file");
    const tags = formData.get("tags")?.split(",").map(t => t.trim()).filter(Boolean) || [];

    const results = [];

    for (const file of files) {
      const tgForm = new FormData();
      tgForm.append("chat_id", env.TG_Chat_ID);
      tgForm.append("document", file, file.name);

      const tgResp = await fetch(
        `https://api.telegram.org/bot${env.TG_Bot_Token}/sendDocument`,
        { method: "POST", body: tgForm }
      );

      const data = await tgResp.json();
      if (!data.ok) {
        return new Response(JSON.stringify({ ok: false, error: data }), {
          headers: { "Content-Type": "application/json" },
          status: 500,
        });
      }

      const fileInfo = data.result.document;
      const id = fileInfo.file_id;
      const url = `${new URL(request.url).origin}/file/${id}`;

      const record = {
        id,
        url,
        name: file.name,
        size: file.size,
        time: Date.now(),
        tags,
      };

      await env.IMG_DB.put(id, JSON.stringify(record));

      results.push(record);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        files: results,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.toString() }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
