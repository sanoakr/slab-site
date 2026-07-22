const ORIGIN = "https://whale2.math.ryukoku.ac.jp/origin-slab";
const TIMEOUT_MS = 3000;

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (url.hostname === "www-slab.math.ryukoku.ac.jp") {
    url.hostname = "slab.math.ryukoku.ac.jp";
    return Response.redirect(url.toString(), 301);
  }

  const originUrl = ORIGIN + url.pathname + url.search;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const originResponse = await fetch(originUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (originResponse.status >= 500) {
      throw new Error(`origin returned ${originResponse.status}`);
    }
    return originResponse;
  } catch (err) {
    clearTimeout(timeout);
    // whale2に到達不能 → Pagesの静的コンテンツへフォールバック
    return next();
  }
}
