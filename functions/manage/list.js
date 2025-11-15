// functions/manage/list.js
export async function onRequestGet({ request, env }) {
  try {
    const list = await env.FILE_KV.list({ prefix: "file:" });

    const result = [];

    for (let item of list.keys) {
      const raw = await env.FILE_KV.get(item.name);
      if (raw) {
        result.push(JSON.parse(raw));
      }
    }

    return new Response(JSON.stringify({ ok: true, files: result }), {
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
