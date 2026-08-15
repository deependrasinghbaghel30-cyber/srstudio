// api/check-video.js

export const runtime = 'nodejs';

export default async function handler(request) {
  const key = process.env.FAL_KEY;

  if (!key) {
    return json(
      { error: 'Server not configured: FAL_KEY missing.' },
      500
    );
  }

  try {
    // Vercel can provide request.url as a relative path.
    // Build a valid absolute URL when necessary.
    const host =
      request.headers?.host ||
      request.headers?.get?.('host') ||
      'localhost';

    const baseUrl = `https://${host}`;

    const url = new URL(request.url, baseUrl);

    const requestId = url.searchParams.get('request_id');
    const model = url.searchParams.get('model');

    if (!requestId || !model) {
      return json(
        {
          error: 'Missing request_id or model.',
          received_request_id: requestId,
          received_model: model,
        },
        400
      );
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
      return json(
        {
          error:
            status?.detail ||
            status?.message ||
            `fal.ai status check failed (${statusRes.status})`,
          fal_status: statusRes.status,
          raw: status,
        },
        statusRes.status
      );
    }

    if (!status) {
      return json({
        status: 'IN_PROGRESS',
      });
    }

    // Still processing
    if (
      status.status === 'IN_PROGRESS' ||
      status.status === 'IN_QUEUE' ||
      status.status === 'QUEUED'
    ) {
      return json({
        status: status.status,
      });
    }

    // Failed
    if (
      status.status === 'FAILED' ||
      status.status === 'ERROR'
    ) {
      return json(
        {
          error:
            status.error ||
            status.detail ||
            'fal.ai reported the generation failed.',
          raw: status,
        },
        502
      );
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
        return json(
          {
            error:
              result?.detail ||
              result?.message ||
              `fal.ai result fetch failed (${resultRes.status})`,
            fal_status: resultRes.status,
            raw: result,
          },
          resultRes.status
        );
      }

      const videoUrl =
        result?.video?.url ||
        result?.data?.video?.url ||
        result?.output?.video?.url ||
        null;

      if (!videoUrl) {
        return json(
          {
            error:
              'Video completed but no video URL was returned by fal.ai.',
            raw: result,
          },
          502
        );
      }

      return json({
        status: 'COMPLETED',
        videoUrl,
      });
    }

    return json({
      status: status.status || 'IN_PROGRESS',
    });
  } catch (error) {
    return json(
      {
        error:
          'Status check failed: ' +
          (error?.message || String(error)),
      },
      502
    );
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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

            


      

  
