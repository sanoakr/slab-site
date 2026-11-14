[English version here](README.md)

# Slab Site

龍谷大学 理工学部 数理・情報科学課程 さの研究室のウェブサイト。

研究室のメンバー紹介、過去の卒業論文テーマ一覧、担当講義（プログラミング、ネットワーク、キャリア入門
など）の資料、そして研究室が開発した各種ツールへのリンクをまとめている。

## エージェント対応

サイトは Cloudflare Pages 経由で公開しており、Pages Functions の middleware
（`functions/_middleware.js`）が whale2 上の Blume サーバーへ中継している。Blume が生成するもの
（`sitemap.xml`、コンテンツシグナル付きの `robots.txt`、`llms.txt`、JSON-LD、OG 画像、
`<ルート>.md` の Markdown ミラー）に加えて、Node アダプタにない次の処理を middleware が担う。

- `Accept: text/markdown` のコンテンツネゴシエーション: ページの URL で Markdown ミラー
  （`/` は `/index.md`）を返し、`Vary: Accept` と `x-markdown-tokens`（トークン数の概算）を付ける。
- 存在しないページを Markdown で要求された場合（存在しない `.md` URL も含む）は、
  ステータス 404 のまま `/404.md` を返す。
- HTML ページには、sitemap・`llms.txt`・`agent-readability.json`・API/AI カタログ・
  `openapi.json`・そのページの Markdown ミラーを示す `Link` ヘッダーを付ける。

確認: `curl -sI -H 'Accept: text/markdown' https://slab.math.ryukoku.ac.jp/`
