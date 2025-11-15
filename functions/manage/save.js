// functions/manage/save.js
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { file_id, file_name, file_type } = body;

    if (!file_id) {
      return new Response(JSON.stringify({ ok: false, error: "missing file_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const item = {
      id: file_id,
      name: file_name || "",
      type: file_type || "",
      tags: [],
      time: Date.now()
    };

    await env.FILE_KV.put(`file:${file_id}`, JSON.stringify(item));

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.toString() }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
