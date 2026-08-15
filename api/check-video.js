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
    // First, check status
    const statusRes = await fetch(
      `https://queue.fal.run/${model}/requests/${requestId}/status`,
      { headers: { 'Authorization': `Key ${key}` } }
    );
    const status = await statusRes.json();

    if (status.status === 'COMPLETED') {
      // Fetch the actual result (contains the video URL)
      const resultRes = await fetch(
        `https://queue.fal.run/${model}/requests/${requestId}`,
        { headers: { 'Authorization': `Key ${key}` } }
      );
      const result = await resultRes.json();
      const videoUrl = result?.video?.url || result?.data?.video?.url || null;
      return json({ status: 'COMPLETED', videoUrl });
    }

    // IN_QUEUE or IN_PROGRESS
    return json({ status: status.status || 'IN_PROGRESS' });
  } catch (e) {
    return json({ error: 'Status check failed: ' + e.message }, 502);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
