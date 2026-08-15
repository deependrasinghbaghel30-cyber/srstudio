// api/generate-video.js
//
// Starts video generation jobs on fal.ai.
// Returns request_id + status_url + response_url for every job.
//
// FAL_KEY stays server-side in Vercel environment variables.

export const config = {
  runtime: 'nodejs',
};

// --------------------------------------------------
// FAL.AI MODELS
// --------------------------------------------------

const MODELS = {
  kling: {
    image: 'fal-ai/kling-video/v2.6/pro/image-to-video',
    text: 'fal-ai/kling-video/v2.6/pro/text-to-video',
  },

  veo: {
    image: 'fal-ai/veo3/image-to-video',
    text: 'fal-ai/veo3',
  },
};

// --------------------------------------------------
// MAIN HANDLER
// --------------------------------------------------

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  const key = process.env.FAL_KEY;

  if (!key) {
    return res.status(500).json({
      error: 'Server not configured: FAL_KEY missing in Vercel.',
    });
  }

  // ------------------------------------------------
  // READ REQUEST BODY
  // ------------------------------------------------

  let body;

  try {
    body = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body;
  } catch (error) {
    return res.status(400).json({
      error: 'Invalid JSON request body.',
    });
  }

  const {
    mode,
    engine,
    prompt,
    imageDataUrl,
    imageDataUrls,
    aspect,
  } = body || {};

  // ------------------------------------------------
  // MAP UI ENGINE → FAL ENGINE
  // ------------------------------------------------

  const eng =
    engine === 'cinematic-pro'
      ? 'veo'
      : 'kling';

  const model =
    MODELS[eng] &&
    MODELS[eng][mode];

  if (!model) {
    return res.status(400).json({
      error: 'Unknown mode or engine.',
      mode,
      engine,
    });
  }

  // ------------------------------------------------
  // ASPECT RATIO
  // ------------------------------------------------

  const ratio =
    ['9:16', '1:1', '16:9'].includes(aspect)
      ? aspect
      : '9:16';

  // ------------------------------------------------
  // COLLECT IMAGES
  // ------------------------------------------------

  const imgs =
    Array.isArray(imageDataUrls) &&
    imageDataUrls.length
      ? imageDataUrls
      : imageDataUrl
        ? [imageDataUrl]
        : [];

  // ------------------------------------------------
  // BUILD JOB INPUTS
  // ------------------------------------------------

  const jobs = [];

  if (mode === 'image') {

    if (!imgs.length) {
      return res.status(400).json({
        error: 'No image provided.',
      });
    }

    for (const img of imgs) {

      const input = {
        prompt:
          prompt ||
          'Cinematic real estate shot, slow smooth camera motion, warm natural light, premium look',

        duration: '5',

        aspect_ratio: ratio,

        generate_audio: true,
      };

      // Kling expects start_image_url
      if (eng === 'kling') {
        input.start_image_url = img;
      }

      // Veo expects image_url
      else {
        input.image_url = img;
      }

      jobs.push(input);
    }

  } else {

    // TEXT → VIDEO

    jobs.push({
      prompt: prompt || '',

      duration: '5',

      aspect_ratio: ratio,

      generate_audio: true,
    });
  }

  // ------------------------------------------------
  // SUBMIT ALL JOBS
  // ------------------------------------------------

  try {

    const started = [];

    for (const input of jobs) {

      const falRes = await fetch(
        `https://queue.fal.run/${model}`,
        {
          method: 'POST',

          headers: {
            Authorization: `Key ${key}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },

          body: JSON.stringify(input),
        }
      );

      // Read response safely
      const text = await falRes.text();

      let data;

      try {
        data = text
          ? JSON.parse(text)
          : null;
      } catch {
        data = text;
      }

      // ------------------------------------------------
      // FAL REQUEST FAILED
      // ------------------------------------------------

      if (!falRes.ok) {

        return res.status(502).json({
          error:
            data?.detail ||
            data?.error ||
            'fal.ai request failed.',

          fal_status: falRes.status,

          fal_status_text: falRes.statusText,

          model,

          fal_response: data,
        });
      }

      // ------------------------------------------------
      // VALIDATE FAL RESPONSE
      // ------------------------------------------------

      if (!data || !data.request_id) {

        return res.status(502).json({
          error:
            'fal.ai accepted the request but did not return request_id.',

          model,

          fal_response: data,
        });
      }

      // ------------------------------------------------
      // IMPORTANT
      //
      // fal.ai REST queue response provides:
      //
      // request_id
      // status_url
      // response_url
      //
      // We pass ALL of them to the browser.
      // ------------------------------------------------

      const requestId =
        data.request_id;

      const statusUrl =
        data.status_url ||
        `https://queue.fal.run/${model}/requests/${requestId}/status`;

      const responseUrl =
        data.response_url ||
        `https://queue.fal.run/${model}/requests/${requestId}`;

      started.push({

        request_id:
          requestId,

        status_url:
          statusUrl,

        response_url:
          responseUrl,

        status:
          data.status ||
          'IN_QUEUE',

        queue_position:
          data.queue_position ?? null,
      });
    }

    // ------------------------------------------------
    // FINAL RESPONSE TO INDEX.HTML
    // ------------------------------------------------

    return res.status(200).json({

      jobs: started,

      // Keep these fields too for compatibility
      // with the current index.html.

      request_ids:
        started.map(
          job => job.request_id
        ),

      status_urls:
        started.map(
          job => job.status_url
        ),

      response_urls:
        started.map(
          job => job.response_url
        ),

      model,

      engine: eng,

      mode,

      count: started.length,
    });

  } catch (error) {

    console.error(
      'generate-video error:',
      error
    );

    return res.status(502).json({

      error:
        'Could not reach fal.ai.',

      message:
        error?.message ||
        String(error),

      model,

      engine: eng,

      mode,
    });
  }
}

