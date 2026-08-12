# SR Studio — Setup

Property reels & video. Text→Video and Image→Video via fal.ai (Kling).

## Files
- `index.html` — the app (UI, custom fields, generate flow)
- `manifest.json`, `sw.js` — makes it installable as a phone app (PWA)
- `api/generate-video.js` — starts a video job on fal.ai (key stays on server)
- `api/check-video.js` — checks job status, returns the video when ready
- `vercel.json` — Vercel config

## Deploy (do this on laptop)

1. **Put files on GitHub**
   - New repo → upload all files (keep the `api/` folder structure) → commit.

2. **Import to Vercel**
   - vercel.com → New Project → import the GitHub repo → Deploy.

3. **Add your fal.ai key (IMPORTANT)**
   - Get a key at fal.ai → dashboard → Keys.
   - In Vercel → your project → Settings → Environment Variables → add:
     - Name: `FAL_KEY`
     - Value: (your fal.ai key)
   - Redeploy (Vercel → Deployments → Redeploy) so the key takes effect.

4. **Test**
   - Open the site → Text→Video → type a scene → Generate.
   - First video takes 1–5 min (normal for AI video).

## Notes / things we may need to adjust together
- The exact fal.ai model IDs and the field names (`image_url`, `duration`, `aspect_ratio`) are set to Kling's standard image/text-to-video. If fal.ai returns an error about a field or model, that's the one line to tweak — ping me with the error message.
- Cost: fal.ai charges per video (roughly a few rupees to ~₹40 per 5s clip depending on model). Billing is on your fal.ai account.
- Branding: the branded video exports as `.webm` (works on WhatsApp, phones, and most players). If you ever need `.mp4` specifically, tell me and I'll add a converter step.
- Copy uses AICredits (UPI). Video uses fal.ai (card). Two keys, two services — see env vars below.

## Environment variables (set in Vercel → Settings → Environment Variables)
- `FAL_KEY` — your fal.ai key (video)
- `COPY_KEY` — your AICredits key (copy)
- optional `COPY_BASE_URL` (default `https://api.aicredits.in/v1`), `COPY_MODEL` (default `claude-3-5-sonnet`)

## What's built (all done)
- Foundation (PWA, custom fields, commercial/residential)
- Three engines: Kling (AI, silent, paid), Veo 3 (AI, sound/dialogue, premium), **Photo reel (FREE — Ken Burns motion on your own photos, no AI)**
- Text→Video and Image→Video
- **Multi-clip reels:** each photo → ~5s cinematic clip → joined + branded server-side → one mp4. 6–8 photos = 30–60s.
- **Voiceover:** AI voice from a script (Hindi/English/Marathi)
- **Batch reels:** one video → one reel per unit, each with its own overlay
- Marketing copy (headline, WhatsApp, NRI pitch, caption) + instructions
- Branding overlay (editable, saved), music (ready tracks + your own), format (9:16/1:1/16:9), details overlay

## Free vs paid
- **Photo reel (free):** uses your uploaded photos, animates them, adds music/branding/details. No API cost. Good for quick reels and when you don't want to spend.
- **Kling / Veo (paid):** real AI-generated cinematic video. Costs per clip on fal.ai.
- Marketing copy is near-free either way.

## API functions (all use FAL_KEY except copy)
- `generate-video.js` — starts clip job(s), Kling or Veo
- `check-video.js` — polls job status
- `stitch-video.js` — joins clips + composites overlay PNG + audio (server-side) → mp4
- `upload.js` — uploads overlay PNG / audio to fal.ai storage
- `generate-voice.js` — TTS voiceover
- `generate-copy.js` — marketing copy (COPY_KEY / AICredits, UPI)

## Where the work happens (keeps phone light)
- Long reels (multiple clips): joining + branding + details + audio all done server-side (fal.ai). Phone only makes a small overlay PNG. Output is clean mp4.
- Short reels (single clip): branding/overlay done in-browser (light enough).
- If server compositing fails on deploy, the in-browser export path still works as a fallback.

## Things we may need to adjust together (on deploy)
- Model IDs may need small tweaks once tested live: Veo (`fal-ai/veo3`), TTS (`fal-ai/elevenlabs/tts/multilingual-v2`), stitch (`fal-ai/ffmpeg-api/compose`). Error about a field/model = one-line fix — send me the message.
- Cost scales with clips + engine (Veo ≫ Kling). Billing on your fal.ai account.
