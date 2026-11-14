[日本語版はこちら](README.ja.md)

# Slab Site

The website of Sano Lab (さの研究室), Department of Mathematical and Information Sciences, Faculty
of Science and Technology, Ryukoku University.

The site introduces the lab: its members, past graduation-thesis themes, and course materials for
lab-affiliated classes such as programming, networking, and career-intro seminars, along with links
to various tools developed by the lab.

## Agent readiness

The site is served through Cloudflare Pages, whose Functions middleware (`functions/_middleware.js`)
proxies requests to the Blume server on whale2. On top of what Blume generates (`sitemap.xml`,
`robots.txt` with content signals, `llms.txt`, JSON-LD, Open Graph images, `<route>.md` mirrors),
the middleware adds what the Node adapter does not provide:

- `Accept: text/markdown` content negotiation: a page URL returns its Markdown mirror
  (`/` → `/index.md`) with `Vary: Accept` and an `x-markdown-tokens` estimate.
- Missing pages requested as Markdown (or any missing `.md` URL) return `/404.md` with status 404.
- Every HTML page carries a `Link` header pointing to the sitemap, `llms.txt`,
  `agent-readability.json`, the API/AI catalogs, `openapi.json`, and the page's Markdown mirror.

Check with `curl -sI -H 'Accept: text/markdown' https://slab.math.ryukoku.ac.jp/`.
