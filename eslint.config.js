//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config"

export default [
  ...tanstackConfig,
  {
    rules: {
      "import/no-cycle": "off",
      "import/order": "off",
      "import/consistent-type-specifier-style": "off",
      "sort-imports": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/require-await": "off",
      "pnpm/json-enforce-catalog": "off",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Warn only: the hits are defensive guards on DB rows and scraped HTML.
      "@typescript-eslint/no-unnecessary-condition": "warn",
    },
  },
  {
    ignores: ["eslint.config.js", ".prettierrc", ".remember/**", ".superpowers/**", ".output/**", ".nitro/**", ".tanstack/**", "dist/**"],
  },
]
