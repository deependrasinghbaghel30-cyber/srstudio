// api/generate-voice.js
// Generates a voiceover (mp3/audio URL) from text using fal.ai's TTS.
// Same FAL_KEY as video — one key for everything.

export const config = { runtime: 'edge' };

// fal.ai TTS model. Supports multilingual output (Hindi / English / Marathi etc.)
const TTS_MODEL = 'fal-ai/elevenlabs/tts/multilingual-v2';

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const key = process.env.FAL_KEY;
  if (!key) return json({ error: 'Server not configured: FAL_KEY missing.' }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid body.' }, 400); }

  const { text, voice } = body || {};
  if (!text || !text.trim()) return json({ error: 'No text for voiceover.' }, 400);

  const input = { text: text.trim() };
  if (voice) input.voice = voice; // optional preset voice name

  try {
    // TTS is usually fast — use the sync run endpoint.
    const res = await fetch(`https://fal.run/${TTS_MODEL}`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data?.detail || 'Voice request failed.', raw: data }, res.status);

    const audioUrl = data?.audio?.url || data?.audio_url || data?.audio_file?.url || null;
    if (!audioUrl) return json({ error: 'Voice generated but no audio URL came back.', raw: data }, 502);

    return json({ audioUrl });
  } catch (e) {
    return json({ error: 'Could not reach fal.ai: ' + e.message }, 502);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
