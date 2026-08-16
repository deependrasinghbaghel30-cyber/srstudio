// api/check-video.js
// Checks whether a fal.ai video job is done, using the EXACT status_url and
// response_url that fal.ai provided when the job was submitted (not reconstructed).

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const key = process.env.FAL_KEY;
  if (!key) return json({ error: 'Server not configured: FAL_KEY missing.' }, 500);

  const { searchParams } = new URL(req.url);
  const statusUrl = searchParams.get('status_url');
  const responseUrl = searchParams.get('response_url');
  if (!statusUrl || !responseUrl) return json({ error: 'Missing status_url or response_url.' }, 400);

  try {
    const statusRes = await fetch(statusUrl, { headers: { 'Authorization': `Key ${key}` } });
    const status = await safeParse(statusRes);

    if (!statusRes.ok) {
      return json({ error: status?.detail || status?.message || `fal.ai status check failed (${statusRes.status})`, raw: status }, statusRes.status);
    }

    if (status === null) {
      return json({ status: 'IN_PROGRESS' });
    }

    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(responseUrl, { headers: { 'Authorization': `Key ${key}` } });
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
