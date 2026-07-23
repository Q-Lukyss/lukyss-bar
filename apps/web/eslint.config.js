import globals from "globals";
import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    // next.config.js tourne sous Node (jamais bundlé pour le navigateur),
    // contrairement au reste de l'app : `process` y est un global légitime.
    files: ["next.config.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
];
