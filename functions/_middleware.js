const ORIGIN = "https://whale2.math.ryukoku.ac.jp/origin-slab";
const TIMEOUT_MS = 3000;
// Ask AI streams an LLM completion — a few seconds of generation time is
// normal, not a sign the origin is down, so it needs a much longer allowance
// than the fast-fail used for ordinary page requests.
const ASK_TIMEOUT_MS = 30000;

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (url.hostname === "www-slab.math.ryukoku.ac.jp") {
    url.hostname = "slab.math.ryukoku.ac.jp";
    return Response.redirect(url.toString(), 301);
  }

  const originUrl = ORIGIN + url.pathname + url.search;

  const controller = new AbortController();
  const timeoutMs = url.pathname === "/api/ask" ? ASK_TIMEOUT_MS : TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  try {
    const originResponse = await fetch(originUrl, {
      method: request.method,
      headers: request.headers,
      body: hasBody ? request.body : undefined,
      // Cloudflare Workers' fetch() throws synchronously when forwarding a
      // streamed request body (POST/PUT/etc.) without this — the error is
      // silently swallowed by the catch block below and falls through to the
      // static fallback, which has no /api/ask route and returns 405.
      duplex: hasBody ? "half" : undefined,
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
