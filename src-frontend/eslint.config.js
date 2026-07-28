import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-plugin-prettier";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        performance: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        HTMLCanvasElement: "readonly",
        MouseEvent: "readonly",
        HTMLVideoElement: "readonly",
        HTMLParagraphElement: "readonly",
        HTMLDivElement: "readonly",
        HTMLMetaElement: "readonly",
        meta: "readonly",
        Props: "readonly",
        State: "readonly",
        alert: "readonly",
        Node: "readonly",
        SVGElement: "readonly",
        SVGGElement: "readonly",
        fetch: "readonly",
        AbortController: "readonly",
        Headers: "readonly",
        Request: "readonly",
        Response: "readonly",
        FormData: "readonly",
        React: "readonly",
        HTMLSelectElement: "readonly",
        Blob: "readonly",
        URL: "readonly",
        HTMLInputElement: "readonly",
        Event: "readonly",
        CustomEvent: "readonly",
        KeyboardEvent: "readonly",
        WebSocket: "readonly",
        NodeJS: "readonly",
        File: "readonly",
        ResizeObserver: "readonly",
        navigator: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": ts,
      "react": react,
      "react-hooks": reactHooks,
      "prettier": prettier,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "prettier/prettier": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
