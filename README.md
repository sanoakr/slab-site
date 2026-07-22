[日本語版はこちら](README.ja.md)

# Slab Site

A documentation site for the lab, built with [Blume](https://useblume.dev), a markdown-first docs
framework on Astro/Vite. This repository holds only content and configuration — the CLI (`npx blume
...`) generates and drives the Astro project at dev/build time.

## Commands

```bash
npm install      # install dependencies
npm run dev      # start the dev server with hot reload (http://localhost:4321)
npm run build    # build static HTML + local search index to dist/
npm run doctor   # diagnose config/content problems
```

## Structure

- `docs/` — page content (Markdown/MDX). Navigation is inferred from the file tree.
- `blume.config.ts` — site-wide config (title, description, theme).
- `public/` — static assets referenced from pages.
- `theme.css` — optional CSS token overrides for theming.

See `CLAUDE.md` for more detailed authoring notes.
