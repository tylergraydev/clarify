import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import perfectionist from "eslint-plugin-perfectionist";
import eslintReactSnob from "eslint-plugin-react-snob";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Electron build output:
    "electron-dist/**",
    // Git worktrees for parallel implementations:
    ".worktrees/**",
    ".claude/**",
    "docs/**",
  ]),
  // TypeScript ESLint recommended and stylistic rules.
  tseslint.configs.recommended,
  tseslint.configs.stylistic,
  // Perfectionist for sorting imports, objects, etc.
  perfectionist.configs["recommended-natural"],
  // Better Tailwind CSS for class sorting and validation.
  {
    ...betterTailwindcss.configs.recommended,
    settings: {
      "better-tailwindcss": {
        entryPoint: "app/globals.css",
      },
    },
  },
  // Opinionated React Snob config.
  {
    ...eslintReactSnob.configs.strict,
  },
  {
    rules: {
      "@typescript-eslint/array-type": "off",
      "better-tailwindcss/enforce-consistent-line-wrapping": "off",
      eqeqeq: "error",
      "react-snob/no-inline-styles": "off",
      "react-snob/require-boolean-prefix-is": "off",
      "react-snob/require-derived-conditional-prefix": "off",
    },
  },
  // Prettier config must be the last to override conflicting rules.
  eslintConfigPrettier,
]);

export default eslintConfig;
