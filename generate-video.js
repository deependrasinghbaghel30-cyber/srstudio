// api/generate-video.js
// Starts a video generation job on fal.ai and returns a request_id.
// The API key stays on the server (set as FAL_KEY in Vercel env vars) — never in the browser.

export const config = { runtime: 'edge' };

// Which fal.ai model to use for each engine + mode.
// kling = Kling 2.6 Pro — cinematic, now WITH native audio (voice/dialogue), cheaper than Veo
// veo   = Veo 3, with sound/dialogue, premium
const MODELS = {
  kling: {
    image: 'fal-ai/kling-video/v2.6/pro/image-to-video',
    text:  'fal-ai/kling-video/v2.6/pro/text-to-video',
  },
  veo: {
    image: 'fal-ai/veo3/image-to-video',
    text:  'fal-ai/veo3',
  },
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const key = process.env.FAL_KEY;
  if (!key) {
    return json({ error: 'Server not configured: FAL_KEY missing.' }, 500);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const { mode, engine, prompt, imageDataUrl, imageDataUrls, aspect } = body || {};
  // Map neutral UI labels to providers (kept server-side so the UI never exposes them)
  const eng = engine === 'cinematic-pro' ? 'veo' : 'kling';
  const model = MODELS[eng] && MODELS[eng][mode];
  if (!model) return json({ error: 'Unknown mode/engine.' }, 400);

  const ratio = ['9:16','1:1','16:9'].includes(aspect) ? aspect : '9:16';

  // Collect images: support single (imageDataUrl) or multiple (imageDataUrls[])
  const imgs = Array.isArray(imageDataUrls) && imageDataUrls.length
    ? imageDataUrls
    : (imageDataUrl ? [imageDataUrl] : []);

  // Build one job per clip. For text mode, a single job.
  const jobs = [];
  if (mode === 'image') {
    if (!imgs.length) return json({ error: 'No image provided.' }, 400);
    for (const img of imgs) {
      const input = { prompt: prompt || 'Cinematic real estate shot, slow smooth camera motion, warm natural light, premium look', duration: '5', aspect_ratio: ratio, generate_audio: true };
      // Kling 2.6 uses start_image_url; Veo uses image_url. Set both is harmless (extra keys ignored),
      // but we set the correct one per engine to be safe.
      if (eng === 'kling') input.start_image_url = img; else input.image_url = img;
      jobs.push(input);
    }
  } else {
    jobs.push({ prompt: prompt || '', duration: '5', aspect_ratio: ratio, generate_audio: true });
  }

  try {
    const started = [];
    for (const input of jobs) {
      const res = await fetch(`https://queue.fal.run/${model}`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) return json({ error: data?.detail || 'fal.ai request failed.', raw: data }, res.status);
      started.push(data.request_id);
    }
    // Return all request_ids + the model so the client can poll each
    return json({ request_ids: started, model });
  } catch (e) {
    return json({ error: 'Could not reach fal.ai: ' + e.message }, 502);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
