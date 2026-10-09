// api/upload.js
// Uploads a base64 data URL (overlay PNG, or audio) to fal.ai storage,
// returns a public URL that the compose endpoint can use.

import { checkPass, LIMITS } from './_guard.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const denied = checkPass(req); if (denied) return denied;
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const key = process.env.FAL_KEY;
  if (!key) return json({ error: 'Server not configured: FAL_KEY missing.' }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid body.' }, 400); }

  const { dataUrl, contentType } = body || {};
  if (!dataUrl) return json({ error: 'No data to upload.' }, 400);

  try {
    // Convert data URL -> binary
    // Only the app's own overlay images are uploaded — never arbitrary files
    // (otherwise the endpoint becomes free public file hosting on your fal account).
    const m = typeof dataUrl === 'string' && dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) return json({ error: 'Only PNG, JPEG or WebP images can be uploaded.' }, 400);
    const type = m[1];
    if (contentType && contentType !== type) return json({ error: 'Content type mismatch.' }, 400);
    const bin = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
    if (bin.length > LIMITS.uploadBytes) return json({ error: 'File too large.' }, 413);
    const sig = Array.from(bin.slice(0, 12));
    const isPng = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47;
    const isJpg = sig[0] === 0xff && sig[1] === 0xd8 && sig[2] === 0xff;
    const isWebp = sig[0] === 0x52 && sig[1] === 0x49 && sig[2] === 0x46 && sig[3] === 0x46 && sig[8] === 0x57 && sig[9] === 0x45;
    if (!((type === 'image/png' && isPng) || (type === 'image/jpeg' && isJpg) || (type === 'image/webp' && isWebp))) {
      return json({ error: 'File content does not match its type.' }, 400);
    }

    // fal.ai storage: get an upload URL, then PUT the bytes
    const initRes = await fetch('https://rest.alpha.fal.ai/storage/upload/initiate', {
      method: 'POST',
      headers: { 'Authorization': `Key ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: type, file_name: type.startsWith('audio') ? 'audio' : 'overlay' }),
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
