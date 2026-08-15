// api/check-video.js
// Checks whether a fal.ai video job is done. Returns status, and the video URL when ready.

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const key = process.env.FAL_KEY;
  if (!key) return json({ error: 'Server not configured: FAL_KEY missing.' }, 500);

  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get('request_id');
  const model = searchParams.get('model');
  if (!requestId || !model) return json({ error: 'Missing request_id or model.' }, 400);

  try {
    const statusRes = await fetch(
      `https://queue.fal.run/${model}/requests/${requestId}/status`,
      { headers: { 'Authorization': `Key ${key}` } }
    );
    const status = await safeParse(statusRes);

    if (!statusRes.ok) {
      return json({ error: status?.detail || status?.message || `fal.ai status check failed (${statusRes.status})`, raw: status }, statusRes.status);
    }

    if (status === null) {
      return json({ status: 'IN_PROGRESS' });
    }

    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(
        `https://queue.fal.run/${model}/requests/${requestId}`,
        { headers: { 'Authorization': `Key ${key}` } }
      );
      const result = await safeParse(resultRes);
      if (!resultRes.ok) {
        return json({ error: result?.detail || result?.message || `fal.ai result fetch failed (${resultRes.status})`, raw: result }, resultRes.status);
      }
      if (result === null) {
        return json({ error: 'fal.ai returned an empty result body.' }, 502);
      }
      const videoUrl = result?.video?.url || result?.data?.video?.url || null;
      if (!videoUrl) {
        return json({ error: 'Video completed but no URL was returned by fal.ai.', raw: result }, 502);
      }
      return json({ status: 'COMPLETED', videoUrl });
    }

    if (status.status === 'FAILED' || status.status === 'ERROR') {
      return json({ error: status?.error || status?.detail || 'fal.ai reported the generation failed.', raw: status }, 502);
    }

    return json({ status: status.status || 'IN_PROGRESS' });
  } catch (e) {
    return json({ error: 'Status check failed: ' + e.message }, 502);
  }
}

async function safeParse(res) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
