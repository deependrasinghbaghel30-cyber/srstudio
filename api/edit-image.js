// api/edit-image.js
// "Model Photos": keeps the same model (from a reference photo) and changes only
// her saree/outfit, using a fal.ai image-editing model. One paid job per prompt.

import { checkPass, isFalMediaUrl, LIMITS } from './_guard.js';

export const config = { runtime: 'edge' };

const MODELS = {
  standard: 'fal-ai/nano-banana-2/edit',   // ~$0.08 per image (1K)
  best: 'fal-ai/nano-banana-pro/edit',     // ~$0.15 per image (1K)
};
const RATIOS = ['3:4', '4:5', '2:3', '1:1', '9:16', '16:9'];

export default async function handler(req) {
  const denied = checkPass(req); if (denied) return denied;
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const key = process.env.FAL_KEY;
  if (!key) return json({ error: 'Server not configured: FAL_KEY missing.' }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid request body.' }, 400); }
  const { imageUrl, prompts, quality, aspect } = body || {};

  if (!isFalMediaUrl(imageUrl)) return json({ error: 'Upload the model photo first.' }, 400);
  const list = (Array.isArray(prompts) ? prompts : []).map(p => String(p || '').trim()).filter(Boolean);
  if (!list.length) return json({ error: 'Choose at least one saree.' }, 400);
  if (list.length > LIMITS.imagesPerCall) return json({ error: `At most ${LIMITS.imagesPerCall} photos per request.` }, 400);

  const model = MODELS[quality] || MODELS.standard;
  const ratio = RATIOS.includes(aspect) ? aspect : '3:4';

  try {
    const jobs = [];
    for (const p of list) {
      const res = await fetch(`https://queue.fal.run/${model}`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p.slice(0, 3000), image_urls: [imageUrl], num_images: 1, aspect_ratio: ratio, output_format: 'jpeg', resolution: '1K' }),
      });
      const data = await safeParse(res);
      if (!res.ok || !data) return json({ error: falError(data) }, res.status || 502);
      jobs.push({
        request_id: data.request_id,
        status_url: data.status_url || `https://queue.fal.run/${model}/requests/${data.request_id}/status`,
        response_url: data.response_url || `https://queue.fal.run/${model}/requests/${data.request_id}`,
      });
    }
    return json({ jobs });
  } catch (e) {
    return json({ error: 'Could not reach fal.ai: ' + e.message }, 502);
  }
}

async function safeParse(res) { const t = await res.text(); if (!t) return null; try { return JSON.parse(t); } catch { return null; } }
function falError(d) {
  const x = d?.detail;
  if (!x) return d?.message || 'fal.ai request failed.';
  if (typeof x === 'string') return x;
  if (Array.isArray(x)) return x.map(i => i?.msg || JSON.stringify(i)).join('; ');
  return JSON.stringify(x);
}
function json(obj, status = 200) { return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } }); }
