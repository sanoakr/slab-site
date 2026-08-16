import { defineConfig } from "blume";

export default defineConfig({
  title: "Slab.math",
  description: "龍谷大学理工学部 数理・情報科学課程 さの研究室",
  feedback: false,
  analytics: {
    scripts: [
      {
        src: "https://www.googletagmanager.com/gtag/js?id=G-21ZLV68166",
        strategy: "defer",
      },
      {
        content: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-21ZLV68166');`,
      },
    ],
  },
  // 検索索引のトークナイザは i18n.defaultLocale から選ばれる（blume 1.2.1 以降）。
  // 日本語では Intl.Segmenter による分かち書きに切り替わり、既定の英語トークナイザが
  // 日本語をすべて区切り文字として捨てる問題（サイト内検索・Ask AI の grounding が
  // 0件になる）を回避する。単一ロケールなので URL 接頭辞や言語切替 UI は出ない。
  i18n: {
    defaultLocale: "ja",
    locales: [{ code: "ja", label: "日本語" }],
  },
  theme: {
    accent: "#b8934a",
    radius: "sm",
    fonts: {
      display: "lora",
      body: "inter",
      mono: "ibm-plex-mono",
    },
  },
  deployment: {
    output: "server",
    adapter: "node",
  },
  ai: {
    ask: {
      enabled: true,
      provider: "openai-compatible",
      // whale2 ローカルの ask-shim 経由で slab-llm の Ollama を叩く。
      //
      // 直接 Ollama を指さない理由: Ollama の OpenAI 互換エンドポイントは
      // think:false を無視するため、素で叩くと thinking の生成に 40 秒以上かかる。
      // reasoning_effort:"none" を送れば抑制できるが、AskConfig にはリクエスト
      // フィールドを足す口が無い。ask-shim はそれを 1 個差し込むだけの中継。
      baseUrl: "http://127.0.0.1:11435/v1",
      // Ollama は認証なし（アクセス制御は slab-llm 側の pf が担う）。この変数は
      // ダミー値を送るためだけに残している。
      apiKeyEnv: "OLLAMA_API_KEY",
      model: "qwen3.8:27b-mlx",
      suggestions: [
        { label: "Slabにはどんなメンバーがいますか？", icon: "users" },
        { label: "配属を検討する際に見るべき資料は？", icon: "file-text" },
        { label: "どんな講義がありますか？", icon: "book-open" },
      ],
    },
  },
});
