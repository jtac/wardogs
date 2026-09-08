// WARDOGS squad tools — API worker. Static pages are served from the assets binding.
const MAX_BODY = 2000;
const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;
const PAGE = 30;

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra } });

function authorized(req, env) {
  const given = req.headers.get('x-squad-pass') || '';
  const want = env.SQUAD_PASS || '';
  if (!want || given.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= given.charCodeAt(i) ^ want.charCodeAt(i);
  return diff === 0;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;

    if (!p.startsWith('/api/')) return env.ASSETS.fetch(req);

    // Check the squad code word without doing anything else.
    if (p === '/api/auth' && req.method === 'POST') {
      return authorized(req, env) ? new Response(null, { status: 204 }) : json({ error: 'Wrong code word. Sentry says no.' }, 401);
    }

    // Serve a stored picture.
    if (p.startsWith('/api/recon/') && req.method === 'GET') {
      const key = p.slice('/api/recon/'.length);
      if (!/^[a-f0-9-]{36}$/.test(key)) return json({ error: 'Bad key' }, 400);
      const { value, metadata } = await env.RECON.getWithMetadata(key, { type: 'arrayBuffer' });
      if (!value) return json({ error: 'No such recon' }, 404);
      return new Response(value, { headers: { 'content-type': (metadata && metadata.type) || 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable' } });
    }

    if (p === '/api/dispatches' && req.method === 'GET') {
      const before = Number(url.searchParams.get('before')) || 0;
      const stmt = before
        ? env.DB.prepare('SELECT id, author, body, image_key, created_at FROM dispatches WHERE id < ? ORDER BY id DESC LIMIT ?').bind(before, PAGE)
        : env.DB.prepare('SELECT id, author, body, image_key, created_at FROM dispatches ORDER BY id DESC LIMIT ?').bind(PAGE);
      const { results } = await stmt.all();
      return json({ dispatches: results, more: results.length === PAGE });
    }

    if (p === '/api/dispatches' && req.method === 'POST') {
      if (!authorized(req, env)) return json({ error: 'Wrong code word. Sentry says no.' }, 401);
      let data;
      try { data = await req.json(); } catch { return json({ error: 'Garbled transmission. Send JSON.' }, 400); }
      const author = String(data.author || '').trim().slice(0, 40);
      const body = String(data.body || '').trim().slice(0, MAX_BODY);
      if (!author) return json({ error: 'Callsign required.' }, 400);
      if (!body && !data.image) return json({ error: 'Empty dispatch. Say something or attach recon.' }, 400);

      let imageKey = null;
      if (data.image) {
        const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(String(data.image));
        if (!m) return json({ error: 'Recon must be a JPEG, PNG or WebP.' }, 400);
        const bytes = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
        if (bytes.byteLength > MAX_IMAGE_BYTES) return json({ error: 'Recon too large. Keep it under 2.5 MB.' }, 413);
        imageKey = crypto.randomUUID();
        await env.RECON.put(imageKey, bytes, { metadata: { type: m[1] } });
      }
      const now = Date.now();
      const r = await env.DB.prepare('INSERT INTO dispatches (author, body, image_key, created_at) VALUES (?, ?, ?, ?)').bind(author, body, imageKey, now).run();
      return json({ dispatch: { id: r.meta.last_row_id, author, body, image_key: imageKey, created_at: now } }, 201);
    }

    const del = /^\/api\/dispatches\/(\d+)$/.exec(p);
    if (del && req.method === 'DELETE') {
      if (!authorized(req, env)) return json({ error: 'Wrong code word. Sentry says no.' }, 401);
      const id = Number(del[1]);
      const row = await env.DB.prepare('SELECT image_key FROM dispatches WHERE id = ?').bind(id).first();
      if (!row) return json({ error: 'Already gone.' }, 404);
      if (row.image_key) await env.RECON.delete(row.image_key);
      await env.DB.prepare('DELETE FROM dispatches WHERE id = ?').bind(id).run();
      return new Response(null, { status: 204 });
    }

    return json({ error: 'No such op.' }, 404);
  }
};
