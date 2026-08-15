// api/generate-copy.js
// Generates marketing copy (headline, WhatsApp message, NRI pitch, caption)
// using an LLM. Key stays on the server.
//
// Uses an OpenAI-compatible endpoint so it works with either:
//   - fal.ai's LLM route, or
//   - AICredits (UPI billing) — just set COPY_BASE_URL + COPY_KEY accordingly.
// Defaults are set for AICredits since copy is cheap and UPI is easier.

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const key = process.env.COPY_KEY;
  const baseUrl = process.env.COPY_BASE_URL || 'https://api.aicredits.in/v1';
  const model = process.env.COPY_MODEL || 'claude-3-5-sonnet';
  if (!key) return json({ error: 'Server not configured: COPY_KEY missing.' }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid body.' }, 400); }

  const { ptype, details, instructions } = body || {};
  const detailLines = (details || [])
    .filter(d => d.label || d.value)
    .map(d => `${d.label}: ${d.value}`)
    .join('\n');

  const typeLabel = ptype === 'residential' ? 'residential' : 'commercial';

  const systemPrompt =
    `You are a marketing copywriter for a Pune-based ${typeLabel} real estate broker who works with NRI and HNI investors. ` +
    `Write crisp, premium, WhatsApp-friendly copy. Avoid hype and clichés. Use Indian real estate context. ` +
    `Return ONLY valid JSON, no markdown, no preamble, with exactly these keys: ` +
    `"headline" (max 8 words), "whatsapp" (2-3 short lines, ready to paste, may use 1-2 emojis), ` +
    `"nri_pitch" (2-3 lines aimed at an NRI investor, focus on yield/appreciation/trust), ` +
    `"caption" (one short social caption with 2-3 relevant hashtags).`;

  const userPrompt =
    `Property type: ${typeLabel}\n` +
    `Details:\n${detailLines || '(no details provided)'}\n` +
    (instructions ? `\nExtra instructions from the broker (follow these closely):\n${instructions}\n` : '') +
    `\nWrite the copy now as JSON.`;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        temperature: 0.6,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) return json({ error: data?.error?.message || 'Copy request failed.', raw: data }, res.status);

    const text = data?.choices?.[0]?.message?.content || '';
    const parsed = safeParseJson(text);
    if (!parsed) return json({ error: 'Copy came back in an unexpected format.', raw: text }, 502);

    return json({ copy: parsed });
  } catch (e) {
    return json({ error: 'Could not reach copy service: ' + e.message }, 502);
  }
}

function safeParseJson(text) {
  // Strip code fences if the model added them, then parse.
  const cleaned = String(text).replace(/```json/gi, '').replace(/```/g, '').trim();
  try { return JSON.parse(cleaned); }
  catch {
    // Try to grab the first {...} block
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    return null;
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
