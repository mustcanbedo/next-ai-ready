import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    testTimeout: 15000,
    // build.test.ts and actions.test.ts both build into the same sample-app
    // fixture and clean it in hooks. Run test files sequentially so they don't
    // race on those shared on-disk artifacts.
    fileParallelism: false,
    // `server-only` intentionally throws when imported outside an RSC bundle.
    // In tests we don't have Next's compiler, so swap it for a no-op stub.
    alias: {
      "server-only": new URL("./test/stubs/server-only.ts", import.meta.url).pathname,
    },
  },
});
