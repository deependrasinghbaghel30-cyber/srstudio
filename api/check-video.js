// api/check-video.js

export const runtime = 'nodejs';

export default async function handler(req, res) {
  const key = process.env.FAL_KEY;

  if (!key) {
    return res.status(500).json({
      error: 'Server not configured: FAL_KEY missing.',
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
        received_request_id: requestId,
        received_model: model,
      });
    }

    // Check fal.ai queue status
    const statusRes = await fetchWithTimeout(
      `https://queue.fal.run/${model}/requests/${requestId}/status`,
      {
        method: 'GET',
        headers: {
          Authorization: `Key ${key}`,
        },
      },
      8000
    );

    const statusText = await statusRes.text();

    let status = null;

    try {
      status = statusText ? JSON.parse(statusText) : null;
    } catch {
      status = null;
    }

    if (!statusRes.ok) {
      return res.status(statusRes.status).json({
        error:
          status?.detail ||
          status?.message ||
          `fal.ai status check failed (${statusRes.status})`,
        fal_status: statusRes.status,
        raw: status,
      });
    }

    if (!status) {
      return res.status(200).json({
        status: 'IN_PROGRESS',
      });
    }

    // Still processing
    if (
      status.status === 'IN_PROGRESS' ||
      status.status === 'IN_QUEUE' ||
      status.status === 'QUEUED'
    ) {
      return res.status(200).json({
        status: status.status,
      });
    }

    // Failed
    if (
      status.status === 'FAILED' ||
      status.status === 'ERROR'
    ) {
      return res.status(502).json({
        error:
          status.error ||
          status.detail ||
          'fal.ai reported the generation failed.',
        raw: status,
      });
    }

    // Completed — fetch actual result
    if (status.status === 'COMPLETED') {
      const resultRes = await fetchWithTimeout(
        `https://queue.fal.run/${model}/requests/${requestId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Key ${key}`,
          },
        },
        8000
      );

      const resultText = await resultRes.text();

      let result = null;

      try {
        result = resultText ? JSON.parse(resultText) : null;
      } catch {
        result = null;
      }

      if (!resultRes.ok) {
        return res.status(resultRes.status).json({
          error:
            result?.detail ||
            result?.message ||
            `fal.ai result fetch failed (${resultRes.status})`,
          fal_status: resultRes.status,
          raw: result,
        });
      }

      const videoUrl =
        result?.video?.url ||
        result?.data?.video?.url ||
        result?.output?.video?.url ||
        null;

      if (!videoUrl) {
        return res.status(502).json({
          error:
            'Video completed but no video URL was returned by fal.ai.',
          raw: result,
        });
      }

      return res.status(200).json({
        status: 'COMPLETED',
        videoUrl,
      });
    }

    return res.status(200).json({
      status: status.status || 'IN_PROGRESS',
    });
  } catch (error) {
    return res.status(502).json({
      error:
        'Status check failed: ' +
        (error?.message || String(error)),
    });
  }
}

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = 8000
) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

      



  

  
      

  
