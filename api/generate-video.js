// api/generate-video.js
// Starts a video generation job on fal.ai and returns the exact status/result URLs
// that fal.ai itself provides (instead of guessing them) — this is the fix for
// the 405 errors, which happened because we were reconstructing URLs ourselves.

export const config = { runtime: 'edge' };

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
  const eng = engine === 'cinematic-pro' ? 'veo' : 'kling';
  const model = MODELS[eng] && MODELS[eng][mode];
  if (!model) return json({ error: 'Unknown mode/engine.' }, 400);

  const ratio = ['9:16','1:1','16:9'].includes(aspect) ? aspect : '9:16';

  const imgs = Array.isArray(imageDataUrls) && imageDataUrls.length
    ? imageDataUrls
    : (imageDataUrl ? [imageDataUrl] : []);

  const jobs = [];
  if (mode === 'image') {
    if (!imgs.length) return json({ error: 'No image provided.' }, 400);
    for (const img of imgs) {
      const input = { prompt: prompt || 'Cinematic real estate shot, slow smooth camera motion, warm natural light, premium look', duration: '5', aspect_ratio: ratio, generate_audio: true };
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

      // Use fal.ai's own URLs — do not reconstruct them ourselves.
      started.push({
        request_id: data.request_id,
        status_url: data.status_url || `https://queue.fal.run/${model}/requests/${data.request_id}/status`,
        response_url: data.response_url || `https://queue.fal.run/${model}/requests/${data.request_id}`,
      });
    }
    return json({ jobs: started });
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
