import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Tests de la logique métier pure (fichiers *.test.ts à côté du code testé).
// tsconfigPaths fait comprendre l'alias "@/" de tsconfig.json à Vitest.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
