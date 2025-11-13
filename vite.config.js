import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    exclude: ["**/e2e/**", "**/*.e2e.spec.js", "**/node_modules/**"],
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },

  base: "/front_7th_chapter2-1/", // Repository 이름과 일치
  build: {
    outDir: "dist", // vite 기본 값이 `dist` 이므로 생략 가능
  },
});
