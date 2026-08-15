// api/generate-video.js
// Starts video generation jobs on fal.ai.
// The API key stays on the server in Vercel FAL_KEY.

export const config = { runtime: 'edge' };

// fal.ai models
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

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json(
      { error: 'Method not allowed' },
      405
    );
  }

  const key = process.env.FAL_KEY;

  if (!key) {
    return json(
      { error: 'Server not configured: FAL_KEY missing.' },
      500
    );
  }

  let body;

  try {
    body = await req.json();
  } catch {
    return json(
      { error: 'Invalid request body.' },
      400
    );
  }

  const {
    mode,
    engine,
    prompt,
    imageDataUrl,
    imageDataUrls,
    aspect,
  } = body || {};

  // Map UI engine names to actual providers.
  const eng =
    engine === 'cinematic-pro'
      ? 'veo'
      : 'kling';

  const model =
    MODELS[eng] &&
    MODELS[eng][mode];

  if (!model) {
    return json(
      {
        error: 'Unknown mode/engine.',
        mode,
        engine,
      },
      400
    );
  }

  const ratio =
    ['9:16', '1:1', '16:9'].includes(aspect)
      ? aspect
      : '9:16';

  // Collect images.
  const imgs =
    Array.isArray(imageDataUrls) &&
    imageDataUrls.length
      ? imageDataUrls
      : imageDataUrl
        ? [imageDataUrl]
        : [];

  // Build jobs.
  const jobs = [];

  if (mode === 'image') {
    if (!imgs.length) {
      return json(
        { error: 'No image provided.' },
        400
      );
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

      if (eng === 'kling') {
        input.start_image_url = img;
      } else {
        input.image_url = img;
      }

      jobs.push(input);
    }
  } else {
    jobs.push({
      prompt: prompt || '',
      duration: '5',
      aspect_ratio: ratio,
      generate_audio: true,
    });
  }

  try {
    const started = [];

    for (const input of jobs) {
      const res = await fetch(
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

      const text = await res.text();

      let data;

      try {
        data = text
          ? JSON.parse(text)
          : null;
      } catch {
        data = text;
      }

      if (!res.ok) {
        return json(
          {
            error:
              data?.detail ||
              data?.message ||
              'fal.ai request failed.',
            fal_status: res.status,
            fal_response: data,
            model,
          },
          res.status
        );
      }

      if (!data?.request_id) {
        return json(
          {
            error:
              'fal.ai did not return a request_id.',
            fal_response: data,
            model,
          },
          502
        );
      }

      // IMPORTANT:
      // Keep fal.ai's own URLs exactly as returned.
      started.push({
        request_id: data.request_id,

        status_url:
          data.status_url || null,

        response_url:
          data.response_url || null,

        cancel_url:
          data.cancel_url || null,
      });
    }

    // Return the complete queue information.
    return json({
      success: true,

      engine: eng,

      mode,

      model,

      jobs: started,

      // Backward compatibility for the existing frontend.
      request_ids: started.map(
        (job) => job.request_id
      ),

      status_urls: started.map(
        (job) => job.status_url
      ),

      response_urls: started.map(
        (job) => job.response_url
      ),
    });

  } catch (error) {
    return json(
      {
        error:
          'Could not reach fal.ai.',
        message:
          error?.message ||
          String(error),
      },
      502
    );
  }
}

function json(
  obj,
  status = 200
) {
  return new Response(
    JSON.stringify(obj),
    {
      status,
      headers: {
        'Content-Type':
          'application/json',
        'Cache-Control':
          'no-store',
      },
    }
  );
}

  
