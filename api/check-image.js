// api/check-image.js — polls a fal.ai image-edit job using the exact URLs fal.ai returned.
import { checkPass, isFalQueueUrl } from './_guard.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const denied = checkPass(req); if (denied) return denied;
  const key = process.env.FAL_KEY;
  if (!key) return json({ error: 'Server not configured: FAL_KEY missing.' }, 500);
  const { searchParams } = new URL(req.url);
  const statusUrl = searchParams.get('status_url'), responseUrl = searchParams.get('response_url');
  if (!isFalQueueUrl(statusUrl) || !isFalQueueUrl(responseUrl)) return json({ error: 'Invalid job URL.' }, 400);
  try {
    const sr = await fetch(statusUrl, { headers: { 'Authorization': `Key ${key}` } });
    const st = await safeParse(sr);
    if (!sr.ok) return json({ error: st?.detail || 'Status check failed.' }, sr.status);
    if (!st) return json({ status: 'IN_PROGRESS' });
    if (st.status === 'COMPLETED') {
      const rr = await fetch(responseUrl, { headers: { 'Authorization': `Key ${key}` } });
      const r = await safeParse(rr);
      if (!rr.ok || !r) return json({ error: (typeof r?.detail === 'string' && r.detail) || 'The photo could not be made. Try a different wording.' }, rr.status || 502);
      const url = r?.images?.[0]?.url;
      if (!url) return json({ error: 'No photo was returned. The request may have been blocked; try again.' }, 502);
      return json({ status: 'COMPLETED', imageUrl: url });
    }
    if (st.status === 'FAILED' || st.status === 'ERROR') return json({ error: st.error || 'The photo could not be made.' }, 502);
    return json({ status: st.status || 'IN_PROGRESS' });
  } catch (e) {
    return json({ error: 'Status check failed: ' + e.message }, 502);
  }
}
async function safeParse(res) { const t = await res.text(); if (!t) return null; try { return JSON.parse(t); } catch { return null; } }
function json(obj, status = 200) { return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } }); }
