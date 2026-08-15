// api/check-video.js

export const runtime = 'nodejs';

export default async function handler(req, res) {
  const key = process.env.FAL_KEY;

  if (!key) {
    return res.status(500).json({
      error: 'FAL_KEY is missing on Vercel.',
    });
  }

  try {
    const host = req.headers.host || 'localhost';
    const url = new URL(req.url, `https://${host}`);

    const requestId = url.searchParams.get('request_id');
    const model = url.searchParams.get('model');

    if (!requestId || !model) {
      return res.status(400).json({
        error: 'Missing request_id or model.',
        request_id: requestId,
        model: model,
      });
    }

    const falUrl =
      `https://queue.fal.run/${model}/requests/${requestId}/status`;

    const falRes = await fetch(falUrl, {
      method: 'GET',
      headers: {
        Authorization: `Key ${key}`,
        Accept: 'application/json',
      },
    });

    const falText = await falRes.text();

    let falBody = null;

    try {
      falBody = falText ? JSON.parse(falText) : null;
    } catch {
      falBody = falText;
    }

    // IMPORTANT:
    // For now return the exact fal.ai response so we can see
    // why it is returning 405.
    if (!falRes.ok) {
      return res.status(502).json({
        error: 'fal.ai returned an error.',
        fal_status: falRes.status,
        fal_status_text: falRes.statusText,
        fal_url: falUrl,
        model: model,
        request_id: requestId,
        fal_response: falBody,
      });
    }

    if (!falBody) {
      return res.status(200).json({
        status: 'IN_PROGRESS',
        fal_status: falRes.status,
      });
    }

    // Still processing
    if (
      falBody.status === 'IN_PROGRESS' ||
      falBody.status === 'IN_QUEUE' ||
      falBody.status === 'QUEUED'
    ) {
      return res.status(200).json({
        status: falBody.status,
      });
    }

    // Failed
    if (
      falBody.status === 'FAILED' ||
      falBody.status === 'ERROR'
    ) {
      return res.status(502).json({
        error:
          falBody.error ||
          falBody.detail ||
          'fal.ai reported that generation failed.',
        raw: falBody,
      });
    }

    // Completed
    if (falBody.status === 'COMPLETED') {
      const resultUrl =
        `https://queue.fal.run/${model}/requests/${requestId}`;

      const resultRes = await fetch(resultUrl, {
        method: 'GET',
        headers: {
          Authorization: `Key ${key}`,
          Accept: 'application/json',
        },
      });

      const resultText = await resultRes.text();

      let resultBody = null;

      try {
        resultBody = resultText ? JSON.parse(resultText) : null;
      } catch {
        resultBody = resultText;
      }

      if (!resultRes.ok) {
        return res.status(502).json({
          error: 'fal.ai result request failed.',
          fal_status: resultRes.status,
          fal_status_text: resultRes.statusText,
          fal_url: resultUrl,
          fal_response: resultBody,
        });
      }

      const videoUrl =
        resultBody?.video?.url ||
        resultBody?.data?.video?.url ||
        resultBody?.output?.video?.url ||
        null;

      if (!videoUrl) {
        return res.status(502).json({
          error: 'Generation completed but video URL was not found.',
          raw: resultBody,
        });
      }

      return res.status(200).json({
        status: 'COMPLETED',
        videoUrl,
      });
    }

    return res.status(200).json({
      status: falBody.status || 'IN_PROGRESS',
      raw: falBody,
    });

  } catch (error) {
    return res.status(502).json({
      error: 'Server error while checking fal.ai.',
      message: error?.message || String(error),
    });
  }
}

      



      



  

  
      

  
