
// api/check-video.js

export const config = {
  runtime: 'edge',
};

export default {
  async fetch(request) {
    const key = process.env.FAL_KEY;

    if (!key) {
      return json(
        { error: 'Server not configured: FAL_KEY missing.' },
        500
      );
    }

    const url = new URL(request.url);
    const requestId = url.searchParams.get('request_id');
    const model = url.searchParams.get('model');

    if (!requestId || !model) {
      return json(
        { error: 'Missing request_id or model.' },
        400
      );
    }

    try {
      // Check fal.ai queue status
      const statusRes = await fetch(
        `https://queue.fal.run/${model}/requests/${requestId}/status`,
        {
          method: 'GET',
          headers: {
            Authorization: `Key ${key}`,
          },
        }
      );

      const statusText = await statusRes.text();

      let status;
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
        return json({ status: 'IN_PROGRESS' });
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

      // Completed — fetch the actual result
      if (status.status === 'COMPLETED') {
        const resultRes = await fetch(
          `https://queue.fal.run/${model}/requests/${requestId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Key ${key}`,
            },
          }
        );

        const resultText = await resultRes.text();

        let result;
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
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

    
