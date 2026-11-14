const ORIGIN = "https://whale2.math.ryukoku.ac.jp/origin-slab";
const TIMEOUT_MS = 3000;
// Ask AI streams an LLM completion — a few seconds of generation time is
// normal, not a sign the origin is down, so it needs a much longer allowance
// than the fast-fail used for ordinary page requests.
//
// The budget is time-to-first-byte, not total generation: `clearTimeout` runs
// as soon as `fetch` resolves, which is when the origin's response headers
// arrive. Those headers wait on the model prefilling the grounded prompt, and
// the retrieved excerpts injected ahead of the question differ per query, so
// the prefix Ollama can reuse across requests is only the fixed instruction —
// every new question pays a full prefill. Measured here: 15.4s TTFB. The
// sibling math site, whose corpus is larger, measures 21–36s and was already
// exceeding 30s, falling through to the static fallback's 405. 60s keeps the
// fast-fail useful while leaving room for a cold prefill under load.
const ASK_TIMEOUT_MS = 60000;

// --- エージェント向け（Accept: text/markdown のコンテンツネゴシエーション等） ---
// blume の Node アダプタ（whale2 の SSR）は Accept ヘッダーによる Markdown の出し分けも
// Link ヘッダーの付与もしない（Vercel / Cloudflare アダプタのみ対応）。そのため、
// blume が生成する `<route>.md` ミラーと `/404.md` を使って、ここで同じ振る舞いを再現する。
const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";
const NOT_FOUND_MARKDOWN_PATH = "/404.md";
const HOME_MARKDOWN_PATH = "/index.md";
// x-markdown-tokens の概算に使う 1 トークンあたりの文字数（Cloudflare の慣例）
const CHARS_PER_TOKEN = 4;
// ページではないパス（静的アセット・API・生成物）。ここは出し分けもヘッダー付与もしない
const NON_PAGE_PREFIXES = ["/api/", "/_astro/", "/og/", "/.well-known/", "/files/", "/images/"];
// すべてのページに付ける発見用 Link ヘッダー（RFC 8288）。各ファイルは blume が生成する
const DISCOVERY_LINKS = [
  '</sitemap.xml>; rel="sitemap"; type="application/xml"',
  '</llms.txt>; rel="describedby"; type="text/plain"',
  '</agent-readability.json>; rel="describedby"; type="application/json"',
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</.well-known/ai-catalog.json>; rel="ai-catalog"; type="application/ai-catalog+json"',
  '</openapi.json>; rel="service-desc"; type="application/json"',
];

// Accept ヘッダーの各メディアタイプの q 値を返す（指定がなければ 0）
function acceptQuality(accept, mediaType) {
  for (const part of accept.split(",")) {
    const [type, ...params] = part.trim().toLowerCase().split(";");
    if (type.trim() !== mediaType) continue;
    const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    const value = q ? Number.parseFloat(q.slice(2)) : 1;
    return Number.isNaN(value) ? 0 : value;
  }
  return 0;
}

// text/markdown を明示し、かつ text/html 以上に優先しているときだけ Markdown を返す
function prefersMarkdown(request) {
  const accept = request.headers.get("accept");
  if (!accept) return false;
  const markdownQ = acceptQuality(accept, "text/markdown");
  return markdownQ > 0 && markdownQ >= acceptQuality(accept, "text/html");
}

// 拡張子のない、アセット以外のパスを「ページ」とみなす
function isPageRoute(pathname) {
  if (NON_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return false;
  const lastSegment = pathname.split("/").pop();
  return !lastSegment.includes(".");
}

// ページの URL に対応する Markdown ミラーのパス（`/` → `/index.md`、`/a/` → `/a.md`）
function markdownPathFor(pathname) {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? HOME_MARKDOWN_PATH : `${trimmed}.md`;
}

function appendVaryAccept(headers) {
  const vary = headers.get("vary");
  if (!vary) {
    headers.set("vary", "Accept");
    return;
  }
  if (!vary.toLowerCase().split(",").some((v) => v.trim() === "accept")) {
    headers.set("vary", `${vary}, Accept`);
  }
}

function pageLinkHeader(pathname) {
  const alternate = `<${markdownPathFor(pathname)}>; rel="alternate"; type="text/markdown"`;
  return [...DISCOVERY_LINKS, alternate].join(", ");
}

// method を指定すると元のリクエストと異なるメソッドで取得する（本文なしの GET 等）
async function fetchOrigin(request, pathname, search, timeoutMs, method = request.method) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const hasBody = method !== "GET" && method !== "HEAD";
  try {
    return await fetch(ORIGIN + pathname + search, {
      method,
      headers: request.headers,
      body: hasBody ? request.body : undefined,
      // Cloudflare Workers' fetch() throws synchronously when forwarding a
      // streamed request body (POST/PUT/etc.) without this — the error is
      // silently swallowed by the caller's catch block and falls through to
      // the static fallback, which has no /api/ask route and returns 405.
      duplex: hasBody ? "half" : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

// オリジンの Markdown を、ネゴシエーション結果として返すレスポンスに包み直す
async function markdownResponse(request, originResponse, status, pagePath) {
  const body = await originResponse.text();
  const headers = new Headers({
    "content-type": MARKDOWN_CONTENT_TYPE,
    "x-markdown-tokens": String(Math.ceil(body.length / CHARS_PER_TOKEN)),
    "cache-control": originResponse.headers.get("cache-control") ?? "public, max-age=0",
  });
  appendVaryAccept(headers);
  if (pagePath) headers.set("link", pageLinkHeader(pagePath));
  return new Response(request.method === "HEAD" ? null : body, { status, headers });
}

// Markdown は HEAD でもトークン数を数えるため本文ごと GET で取得する
function fetchMarkdown(request, pathname) {
  return fetchOrigin(request, pathname, "", TIMEOUT_MS, "GET");
}

// 存在しないページへの Markdown 要求には、ステータス 404 のまま /404.md の本文を返す
async function notFoundMarkdown(request) {
  const notFound = await fetchMarkdown(request, NOT_FOUND_MARKDOWN_PATH);
  if (!notFound.ok) return null;
  return markdownResponse(request, notFound, 404, null);
}

async function serveMarkdown(request, pathname) {
  const originResponse = await fetchMarkdown(request, markdownPathFor(pathname));
  if (originResponse.ok) return markdownResponse(request, originResponse, 200, pathname);
  if (originResponse.status === 404) return notFoundMarkdown(request);
  throw new Error(`origin returned ${originResponse.status}`);
}

// HTML ページに Vary: Accept と発見用 Link ヘッダーを付ける
function decoratePage(originResponse, pathname) {
  const contentType = originResponse.headers.get("content-type") ?? "";
  if (!contentType.startsWith("text/html")) return originResponse;
  const response = new Response(originResponse.body, originResponse);
  appendVaryAccept(response.headers);
  if (originResponse.ok) response.headers.set("link", pageLinkHeader(pathname));
  return response;
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (url.hostname === "www-slab.math.ryukoku.ac.jp") {
    url.hostname = "slab.math.ryukoku.ac.jp";
    return Response.redirect(url.toString(), 301);
  }

  const isRead = request.method === "GET" || request.method === "HEAD";
  const isPage = isRead && isPageRoute(url.pathname);
  const timeoutMs = url.pathname === "/api/ask" ? ASK_TIMEOUT_MS : TIMEOUT_MS;

  try {
    if (isPage && prefersMarkdown(request)) {
      const markdown = await serveMarkdown(request, url.pathname);
      if (markdown) return markdown;
    }

    const originResponse = await fetchOrigin(request, url.pathname, url.search, timeoutMs);

    if (originResponse.status >= 500) {
      throw new Error(`origin returned ${originResponse.status}`);
    }
    // 存在しない `.md` URL は HTML の 404 ページではなく Markdown の 404 を返す
    if (isRead && originResponse.status === 404 && url.pathname.endsWith(".md")) {
      const notFound = await notFoundMarkdown(request);
      if (notFound) return notFound;
    }
    return isPage ? decoratePage(originResponse, url.pathname) : originResponse;
  } catch (err) {
    // whale2に到達不能 → Pagesの静的コンテンツへフォールバック
    return next();
  }
}
