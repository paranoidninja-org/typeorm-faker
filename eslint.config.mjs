// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierEslintRecommended from "eslint-plugin-prettier/recommended";

export default tseslint.config(
  {
    ignores: ["eslint.config.mjs", "prettier.config.mjs", "dist/*", "node_modules/*"],
  },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  prettierEslintRecommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
    {
        files: ["**/*.spec.ts"],
        rules: {
            "@typescript-eslint/no-non-null-assertion": "off",
        },
    }
);
