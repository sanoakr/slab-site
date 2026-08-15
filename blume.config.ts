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
      baseUrl: "http://slab-llm.math.ryukoku.ac.jp:11434/v1",
      apiKeyEnv: "OLLAMA_API_KEY",
      model: "gemma4:e4b",
      suggestions: [
        { label: "Slabにはどんなメンバーがいますか？", icon: "users" },
        { label: "配属を検討する際に見るべき資料は？", icon: "file-text" },
        { label: "どんな講義がありますか？", icon: "book-open" },
      ],
    },
  },
});
