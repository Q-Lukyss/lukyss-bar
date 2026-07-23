import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Contre une vraie API (cf. src/setup.ts) : pas de parallélisme excessif
    // pour éviter de saturer une seule instance/DB de test.
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
});
