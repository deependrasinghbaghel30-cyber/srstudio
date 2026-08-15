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

    // IMPORTANT:
    // These URLs must come from fal.ai's original queue response.
    const statusUrl = url.searchParams.get('status_url');
    const responseUrl = url.searchParams.get('response_url');

    if (!requestId) {
      return res.status(400).json({
        error: 'Missing request_id.',
        request_id: requestId,
      });
    }

    if (!statusUrl) {
      return res.status(400).json({
        error: 'Missing status_url.',
        request_id: requestId,
        message:
          'Frontend must pass the exact status_url returned by fal.ai when the job was created.',
      });
    }

    // --------------------------------------------------
    // CHECK FAL.AI STATUS
    // --------------------------------------------------

    const falRes = await fetch(statusUrl, {
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

    // --------------------------------------------------
    // FAL ERROR
    // --------------------------------------------------

    if (!falRes.ok) {
      return res.status(502).json({
        error: 'fal.ai returned an error.',
        fal_status: falRes.status,
        fal_status_text: falRes.statusText,
        status_url: statusUrl,
        request_id: requestId,
        fal_response: falBody,
      });
    }

    // --------------------------------------------------
    // EMPTY RESPONSE
    // --------------------------------------------------

    if (!falBody) {
      return res.status(200).json({
        status: 'IN_PROGRESS',
        request_id: requestId,
      });
    }

    // --------------------------------------------------
    // IN PROGRESS
    // --------------------------------------------------

    if (
      falBody.status === 'IN_PROGRESS' ||
      falBody.status === 'IN_QUEUE' ||
      falBody.status === 'QUEUED'
    ) {
      return res.status(200).json({
        status: falBody.status,
        request_id: requestId,
      });
    }

    // --------------------------------------------------
    // FAILED
    // --------------------------------------------------

    if (
      falBody.status === 'FAILED' ||
      falBody.status === 'ERROR'
    ) {
      return res.status(502).json({
        error:
          falBody.error ||
          falBody.detail ||
          'fal.ai reported that generation failed.',
        status: 'FAILED',
        request_id: requestId,
        raw: falBody,
      });
    }

    // --------------------------------------------------
    // COMPLETED
    // --------------------------------------------------

    if (falBody.status === 'COMPLETED') {

      // Prefer the exact response_url returned by fal.ai.
      if (!responseUrl) {
        return res.status(502).json({
          error: 'Generation completed but response_url is missing.',
          request_id: requestId,
          status: 'COMPLETED',
          raw: falBody,
        });
      }

      const resultRes = await fetch(responseUrl, {
        method: 'GET',
        headers: {
          Authorization: `Key ${key}`,
          Accept: 'application/json',
        },
      });

      const resultText = await resultRes.text();

      let resultBody = null;

      try {
        resultBody = resultText
          ? JSON.parse(resultText)
          : null;
      } catch {
        resultBody = resultText;
      }

      // ------------------------------------------------
      // RESULT REQUEST FAILED
      // ------------------------------------------------

      if (!resultRes.ok) {
        return res.status(502).json({
          error: 'fal.ai result request failed.',
          fal_status: resultRes.status,
          fal_status_text: resultRes.statusText,
          response_url: responseUrl,
          request_id: requestId,
          fal_response: resultBody,
        });
      }

      // ------------------------------------------------
      // FIND VIDEO URL
      // ------------------------------------------------

      const videoUrl =
        resultBody?.video?.url ||
        resultBody?.data?.video?.url ||
        resultBody?.output?.video?.url ||
        resultBody?.video_url ||
        resultBody?.data?.video_url ||
        null;

      if (!videoUrl) {
        return res.status(502).json({
          error:
            'Generation completed but video URL was not found.',
          request_id: requestId,
          raw: resultBody,
        });
      }

      return res.status(200).json({
        status: 'COMPLETED',
        request_id: requestId,
        videoUrl,
      });
    }

    // --------------------------------------------------
    // UNKNOWN STATUS
    // --------------------------------------------------

    return res.status(200).json({
      status: falBody.status || 'IN_PROGRESS',
      request_id: requestId,
      raw: falBody,
    });

  } catch (error) {
    return res.status(502).json({
      error: 'Server error while checking fal.ai.',
      message: error?.message || String(error),
    });
  }
}

      
      
  
        

        


      



  

  
      

  
