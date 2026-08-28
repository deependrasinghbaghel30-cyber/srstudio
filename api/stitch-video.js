// api/stitch-video.js
// Joins multiple clips into one video (server-side, full quality → mp4).
// Uses fal.ai's ffmpeg compose endpoint. Returns fal.ai's own status/response URLs.

export const config = { runtime: 'edge' };

const COMPOSE_MODEL = 'fal-ai/ffmpeg-api/compose';

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const key = process.env.FAL_KEY;
  if (!key) return json({ error: 'Server not configured: FAL_KEY missing.' }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid body.' }, 400); }

  const { clipUrls, audioUrl, overlayImageUrl, clipDurationMs } = body || {};
  if (!Array.isArray(clipUrls) || clipUrls.length === 0) {
    return json({ error: 'No clips to join.' }, 400);
  }

  // fal's compose API needs an explicit duration on every keyframe, and timestamps
  // in milliseconds. Clips are laid end to end so they play one after another.
  const clipMs = Number(clipDurationMs) > 0 ? Number(clipDurationMs) : 5000;
  const totalMs = clipMs * clipUrls.length;

  const tracks = [
    {
      id: 'video_track',
      type: 'video',
      keyframes: clipUrls.map((url, i) => ({
        url,
        timestamp: i * clipMs,
        duration: clipMs,
      })),
    },
  ];

  if (overlayImageUrl) {
    tracks.push({
      id: 'overlay_track',
      type: 'image',
      keyframes: [{ url: overlayImageUrl, timestamp: 0, duration: totalMs }],
    });
  }

  if (audioUrl) {
    tracks.push({
      id: 'audio_track',
      type: 'audio',
      keyframes: [{ url: audioUrl, timestamp: 0, duration: totalMs }],
    });
  }

  try {
    const res = await fetch(`https://queue.fal.run/${COMPOSE_MODEL}`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracks }),
    });
    const data = await res.json();
    if (!res.ok) return json({ error: formatFalError(data), raw: data }, res.status);

    return json({
      request_id: data.request_id,
      status_url: data.status_url || `https://queue.fal.run/${COMPOSE_MODEL}/requests/${data.request_id}/status`,
      response_url: data.response_url || `https://queue.fal.run/${COMPOSE_MODEL}/requests/${data.request_id}`,
    });
  } catch (e) {
    return json({ error: 'Could not reach fal.ai: ' + e.message }, 502);
  }
}

function formatFalError(data) {
  const d = data?.detail;
  if (!d) return data?.message || 'Stitch request failed.';
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) {
    return d.map(e => {
      if (typeof e === 'string') return e;
      const field = Array.isArray(e?.loc) ? e.loc.join('.') : '';
      return field ? `${field}: ${e?.msg || JSON.stringify(e)}` : (e?.msg || JSON.stringify(e));
    }).join(' | ');
  }
  if (typeof d === 'object') {
    try { return JSON.stringify(d); } catch { return 'Stitch request failed.'; }
  }
  return String(d);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
