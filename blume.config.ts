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
      // slab-llm 常駐の vllm-mlx。thinking はサーバー起動時に無効化してあるため、
      // ここから特別なパラメータを送らなくても数秒で応答が返る（Ollama の
      // OpenAI 互換エンドポイントでは thinking を止められず 40 秒以上かかっていた）。
      baseUrl: "http://slab-llm.math.ryukoku.ac.jp:8000/v1",
      // vllm-mlx は認証なし（アクセス制御は slab-llm 側の pf が担う）。この変数は
      // ダミー値を送るためだけに残している。
      apiKeyEnv: "OLLAMA_API_KEY",
      // --served-model-name のエイリアス。量子化を差し替えてもこの名前は変わらない。
      model: "qwen3.8",
      suggestions: [
        { label: "Slabにはどんなメンバーがいますか？", icon: "users" },
        { label: "配属を検討する際に見るべき資料は？", icon: "file-text" },
        { label: "どんな講義がありますか？", icon: "book-open" },
      ],
    },
  },
});
