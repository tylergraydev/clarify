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
      eqeqeq: "error",
      "react-snob/no-inline-styles": "off",
      "react-snob/require-boolean-prefix-is": [
        "error",
        {
          allowedPrefixes: ["as", "can", "has", "is", "should", "was", "will"],
        },
      ],
      "react-snob/require-derived-conditional-prefix": "off",
      "@typescript-eslint/array-type": "off"
    },
  },
  // Prettier config must be the last to override conflicting rules.
  eslintConfigPrettier,
]);

export default eslintConfig;
