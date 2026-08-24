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
      return json({ error: formatFalError(status, statusRes.status), raw: status }, statusRes.status);
    }

    if (status === null) {
      return json({ status: 'IN_PROGRESS' });
    }

    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(responseUrl, { headers: { 'Authorization': `Key ${key}` } });
      const result = await safeParse(resultRes);
      if (!resultRes.ok) {
        return json({ error: formatFalError(result, resultRes.status), raw: result }, resultRes.status);
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
      return json({ error: formatFailure(status), raw: status }, 502);
    }

    return json({ status: status.status || 'IN_PROGRESS' });
  } catch (e) {
    return json({ error: 'Status check failed: ' + e.message }, 502);
  }
}

// A failed job puts the reason in `error`, `detail`, or the log lines — check all of them.
function formatFailure(status) {
  const e = status?.error;
  if (typeof e === 'string' && e.trim()) return e;
  if (e && typeof e === 'object') {
    const msg = e.message || e.msg || e.detail;
    if (typeof msg === 'string' && msg.trim()) return msg;
    try { return JSON.stringify(e); } catch {}
  }
  const fromDetail = formatFalError(status, 502);
  if (fromDetail && !fromDetail.startsWith('fal.ai request failed')) return fromDetail;

  // Some failures only explain themselves in the logs.
  if (Array.isArray(status?.logs) && status.logs.length) {
    const lines = status.logs.map(l => (typeof l === 'string' ? l : l?.message)).filter(Boolean);
    if (lines.length) return lines.slice(-3).join(' | ');
  }
  try { return 'Generation failed: ' + JSON.stringify(status); }
  catch { return 'fal.ai reported the generation failed.'; }
}

async function safeParse(res) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

// Turns any fal.ai error shape (string, FastAPI-style array, or object) into readable text.
function formatFalError(data, statusCode) {
  const d = data?.detail;
  if (!d) return data?.message || `fal.ai request failed (${statusCode}).`;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) {
    return d.map(e => {
      if (typeof e === 'string') return e;
      const field = Array.isArray(e?.loc) ? e.loc.join('.') : '';
      return field ? `${field}: ${e?.msg || JSON.stringify(e)}` : (e?.msg || JSON.stringify(e));
    }).join(' | ');
  }
  if (typeof d === 'object') {
    try { return JSON.stringify(d); } catch { return `fal.ai request failed (${statusCode}).`; }
  }
  return String(d);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
