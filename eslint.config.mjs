import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    rules: {
      "indent": ["error", 2],
      "quotes": ["error", "double"],
      "no-unreachable": ["error"],
      "camelcase": ["error"],
      "default-case": ["error"],
      "eqeqeq": ["error", "always"],
      "max-lines": ["warn", { "max": 300, "skipComments": true }],
      "no-negated-condition": ["warn"],
      "yoda": ["error"],
      "object-curly-spacing": ["error", "always"],
      "space-before-blocks": "error",
      "@typescript-eslint/semi": ["error"],
      "@typescript-eslint/comma-spacing": ["error", { "before": false, "after": true }],
      "max-len": [
        "error",
        {
          "code": 120,
          "ignoreUrls": true,
          "ignoreStrings": true,
          "ignoreTemplateLiterals": true,
          "ignoreRegExpLiterals": true,
          "ignoreComments": true
        }
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "vars": "all",
          "args": "after-used",
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "ignoreRestSiblings": true
        }
      ]
    }
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
