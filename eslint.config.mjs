import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "public/**",
    "next-env.d.ts",
    "src/**",
    "server/**",
    "scripts/**",
    "vite.config.ts",
    "test-results/**",
    "playwright-report/**",
  ]),
  { rules: { "@next/next/no-img-element": "off" } },
]);
