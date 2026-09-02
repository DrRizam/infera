import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

/**
 * ESLint 9 flat config. Four zones, each with its own globals:
 *   - src/**            browser + React (JSX, hooks rules)
 *   - scripts/**, *.config.js, worker/**   Node/build scripts
 *   - supabase/functions/**   Deno edge functions (TS)
 *   - android/**, dist/**, node_modules/**   ignored
 */
export default [
  {
    ignores: [
      "dist/**",
      "dev-dist/**",
      "android/**",
      "node_modules/**",
      "coverage/**",
      "public/**",
      "supabase/functions/**",
    ],
  },

  js.configs.recommended,

  // App source — browser + React.
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/prop-types": "off",
      // Apostrophes and quotes in JSX text render fine and are used
      // deliberately throughout the copy — the escaped forms just hurt
      // readability. The genuinely risky characters (`>`, `}`) are still
      // caught by react/no-unknown-property and JSX parsing.
      "react/no-unescaped-entities": "off",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  // Vitest test files.
  {
    files: ["src/**/*.test.{js,jsx}", "src/**/__tests__/**/*.{js,jsx}"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Build / tooling scripts + the Cloudflare Worker.
  {
    files: ["*.config.js", "scripts/**/*.{js,mjs}", "worker/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
