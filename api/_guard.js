// api/_guard.js — shared checks (files starting with "_" are not API routes on Vercel).

// Optional passcode. If APP_PASSCODE is set in Vercel, every API call must send it
// (the app asks for it once and remembers it). Without it, anyone who finds the
// site URL could spend your fal.ai credits. Not set = open, as before.
export function checkPass(req) {
  const need = (process.env.APP_PASSCODE || '').trim();
  if (!need) return null;
  const got = (req.headers.get('x-sr-pass') || '').trim();
  if (got === need) return null;
  return new Response(JSON.stringify({ error: 'Passcode required.', needPass: true }), {
    status: 401, headers: { 'Content-Type': 'application/json' },
  });
}

// Only fal.ai queue URLs may be fetched with the FAL key. Without this check a
// crafted status_url would make the server send the key to any website.
export function isFalQueueUrl(u) {
  try {
    const x = new URL(u);
    return x.protocol === 'https:' && (x.hostname === 'queue.fal.run' || x.hostname.endsWith('.queue.fal.run'));
  } catch { return false; }
}

// Media the server may hand to fal.ai jobs: only fal's own storage/CDN hosts, so the
// joiner can't be used to process (or fetch) arbitrary files from the internet.
export function isFalMediaUrl(u) {
  try {
    const x = new URL(u);
    if (x.protocol !== 'https:') return false;
    const h = x.hostname;
    return h === 'fal.media' || h.endsWith('.fal.media') || h.endsWith('.fal.run') || h.endsWith('.fal.ai')
      || (h === 'storage.googleapis.com' && x.pathname.startsWith('/falserverless/'));
  } catch { return false; }
}

// Per-request caps — one call can never start an unbounded number of paid jobs.
export const LIMITS = { imagesPerCall: 8, scenesPerCall: 12, voiceChars: 3000, clipsPerJoin: 20, uploadBytes: 4 * 1024 * 1024 };
