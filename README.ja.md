[English version here](README.md)

# Slab Site

研究室のドキュメントサイト。Markdown ファースト構成のドキュメントフレームワーク
[Blume](https://useblume.dev)（Astro/Vite ベース）で構築されている。このリポジトリにはコンテンツと
設定のみが含まれる — CLI（`npx blume ...`）が dev/build 時に Astro プロジェクトを生成・実行する。

## コマンド

```bash
npm install      # 依存関係のインストール
npm run dev      # 開発サーバー起動（ホットリロード、http://localhost:4321）
npm run build    # 静的HTML + ローカル検索インデックスを dist/ に生成
npm run doctor   # 設定・コンテンツの問題を診断
```

## 構成

- `docs/` — ページコンテンツ（Markdown/MDX）。ナビゲーションはファイルツリーから自動推論される。
- `blume.config.ts` — サイト全体の設定（タイトル、説明、テーマ）。
- `public/` — ページから参照する静的アセット。
- `theme.css` — テーマのCSSトークンを上書きするための任意ファイル。

詳細な執筆ガイドは `CLAUDE.md` を参照。
