// api/upload.js
// Uploads a base64 data URL (overlay PNG, or audio) to fal.ai storage,
// returns a public URL that the compose endpoint can use.

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const key = process.env.FAL_KEY;
  if (!key) return json({ error: 'Server not configured: FAL_KEY missing.' }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid body.' }, 400); }

  const { dataUrl, contentType } = body || {};
  if (!dataUrl) return json({ error: 'No data to upload.' }, 400);

  try {
    // Convert data URL -> binary
    const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
    const type = contentType || (m ? m[1] : 'application/octet-stream');
    const b64 = m ? m[2] : dataUrl;
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));

    // fal.ai storage: get an upload URL, then PUT the bytes
    const initRes = await fetch('https://rest.alpha.fal.ai/storage/upload/initiate', {
      method: 'POST',
      headers: { 'Authorization': `Key ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: type, file_name: 'overlay' }),
    });
    const init = await initRes.json();
    if (!initRes.ok || !init.upload_url) {
      return json({ error: init?.detail || 'Could not init upload.', raw: init }, 502);
    }

    const putRes = await fetch(init.upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': type },
      body: bin,
    });
    if (!putRes.ok) return json({ error: 'Upload failed.' }, 502);

    return json({ url: init.file_url || init.public_url });
  } catch (e) {
    return json({ error: 'Upload error: ' + e.message }, 502);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
