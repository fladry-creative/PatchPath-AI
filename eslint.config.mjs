import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".husky/**",
      "*.config.js",
      "*.config.mjs",
    ],
  },
  {
    rules: {
      // Modern October 2025 Best Practices

      // TypeScript: Strict type checking
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      "@typescript-eslint/consistent-type-imports": ["error", {
        prefer: "type-imports",
        fixStyle: "inline-type-imports"
      }],

      // React 19: Modern patterns
      "react/jsx-no-leaked-render": "error",
      "react/jsx-key": ["error", { checkFragmentShorthand: true }],
      "react-hooks/exhaustive-deps": "warn",

      // Next.js 15: App Router best practices
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "error",

      // Code quality
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",

      // Accessibility
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-role": "error",

      // Prettier integration (disable conflicting rules)
      "prettier/prettier": "off", // Let Prettier handle formatting
    }
  }
];

export default eslintConfig;
