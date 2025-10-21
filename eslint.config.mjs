import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    ignores: ["node_modules/", ".next/", "dist/"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "@next/next": nextPlugin,
    },
    rules: {
      // ✅ Cho phép dùng any, không fail build
      "@typescript-eslint/no-explicit-any": "off",
      // ✅ Không bắt lỗi <img> (vì bạn có nhiều ảnh tĩnh)
      "@next/next/no-img-element": "off",
      // ✅ Giảm mức cảnh báo cho các lỗi nhỏ khác
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
];
