import path from "node:path";
import { lingui } from "@lingui/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      // 相対パスが嫌なので、 "@/..." で src 以下を参照できるようにする
      // tsconfig.json にも書いてるけど、それだけだと vite で動かないのでこっちにも必要
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react({
      plugins: [["@lingui/swc-plugin", {}]],
    }),
    lingui(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
    watch: {
      // devcontainer内で動かすときはファイル変更を監視するために必要
      usePolling: true,
    },
  },
});
