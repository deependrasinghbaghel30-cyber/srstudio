// api/generate-copy.js
// Marketing copy (headline, WhatsApp message, NRI pitch, caption) from the
// property details. (This file previously contained a copy of the video
// endpoint by mistake, so "Write copy" could never work.)
//
// Keys (Vercel → Settings → Environment Variables), first one found is used:
//   COPY_KEY            AICredits (or any OpenAI-compatible) key — paid by UPI
//     COPY_BASE_URL     default https://api.aicredits.in/v1
//     COPY_MODEL        default claude-3-5-sonnet
//   ANTHROPIC_API_KEY   direct Claude API (optional alternative)
//     ANTHROPIC_MODEL   default claude-haiku-4-5-20251001

import { checkPass } from './_guard.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const denied = checkPass(req); if (denied) return denied;
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid request body.' }, 400); }

  const ptype = body?.ptype === 'residential' ? 'residential' : 'commercial';
  const details = (Array.isArray(body?.details) ? body.details : [])
    .map(d => ({ label: String(d?.label || '').trim().slice(0, 80), value: String(d?.value || '').trim().slice(0, 300) }))
    .filter(d => d.label || d.value)
    .slice(0, 30);
  const instructions = String(body?.instructions || '').trim().slice(0, 1500);
  if (!details.length) return json({ error: 'Add at least one detail first (price, location, etc.).' }, 400);

  const facts = details.map(d => `- ${d.label ? d.label + ': ' : ''}${d.value}`).join('\n')
  const system = `You write marketing copy for an Indian real-estate broker who sells and leases ${ptype === 'commercial' ? 'commercial property (offices, retail, showrooms) to investors, including NRI and HNI buyers' : 'residential homes (apartments, villas) to families and NRI buyers'}.
Rules:
- Use ONLY the facts given. Never invent prices, rental yields, amenities, distances, approvals or RERA numbers.
- If a RERA number is given, include it exactly as written in the WhatsApp message.
- Clear, premium, confident tone. No exaggerated claims ("best", "guaranteed returns").
- Return ONLY a JSON object with these string keys, nothing else:
  "headline"  (max 10 words),
  "whatsapp"  (60-120 words, short lines, 2-4 emojis, ends with a call to action),
  "nri_pitch" (70-120 words, for an NRI investor abroad: why this property, how a remote purchase/visit can be handled),
  "caption"   (Instagram/Facebook caption, 30-60 words, 5-8 relevant hashtags at the end).`
  const user = `Property type: ${ptype}\nFacts:\n${facts}${instructions ? `\n\nExtra instructions from the broker (follow them unless they ask you to invent facts):\n${instructions}` : ''}`

  try {
    let text = ''
    if (process.env.COPY_KEY) {
      const base = (process.env.COPY_BASE_URL || 'https://api.aicredits.in/v1').replace(/\/+$/, '')
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.COPY_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.COPY_MODEL || 'claude-3-5-sonnet',
          max_tokens: 1200, temperature: 0.7,
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        }),
      })
      const data = await safeJson(res)
      if (!res.ok) return json({ error: `Copy service error (${res.status}): ${errText(data)}` }, 502)
      text = data?.choices?.[0]?.message?.content || ''
    } else if (process.env.ANTHROPIC_API_KEY) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
          max_tokens: 1200, system, messages: [{ role: 'user', content: user }],
        }),
      })
      const data = await safeJson(res)
      if (!res.ok) return json({ error: `Claude API error (${res.status}): ${errText(data)}` }, 502)
      text = (data?.content || []).map(c => c?.text || '').join('')
    } else {
      return json({ error: 'Server not configured: add COPY_KEY (AICredits) in Vercel → Settings → Environment Variables, then redeploy.' }, 500)
    }

    const copy = parseCopy(text)
    if (!copy) return json({ error: 'The AI reply could not be read. Please try again.' }, 502)
    return json({ copy })
  } catch (e) {
    return json({ error: 'Could not reach the copy service: ' + e.message }, 502)
  }
}

function parseCopy(text) {
  const t = String(text || '')
  const s = t.indexOf('{'), e = t.lastIndexOf('}')
  if (s < 0 || e <= s) return null
  try {
    const o = JSON.parse(t.slice(s, e + 1))
    const pick = k => (typeof o[k] === 'string' ? o[k].trim() : '')
    const copy = { headline: pick('headline'), whatsapp: pick('whatsapp'), nri_pitch: pick('nri_pitch'), caption: pick('caption') }
    return Object.values(copy).some(Boolean) ? copy : null
  } catch { return null }
}

async function safeJson(res) { const t = await res.text(); try { return JSON.parse(t) } catch { return { message: t.slice(0, 200) } } }
function errText(d) { const m = d?.error?.message || d?.error || d?.message || d?.detail || 'request failed'; return typeof m === 'string' ? m : JSON.stringify(m) }

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } })
}
