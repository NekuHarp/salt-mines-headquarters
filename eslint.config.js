import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import js from "@eslint/js";
import nodePlugin from "eslint-plugin-n";
import pluginSecurity from "eslint-plugin-security";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

// Rules shared by application code and build config alike.
const sharedRules = {
    "sort-imports": "warn",
    "no-implicit-coercion": "error",
    "no-unused-vars": ["error", { argsIgnorePattern: "next" }],
};

export default [
    { ignores: ["dist/**"] },
    js.configs.recommended,
    pluginSecurity.configs.recommended,

    // Application code: runs in the browser, written in JSX.
    {
        files: ["src/**/*.{js,jsx}"],
        ...react.configs.flat.recommended,
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: globals.browser,
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        plugins: {
            react,
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        settings: { react: { version: "detect" } },
        rules: {
            ...react.configs.flat.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true },
            ],
            // The new JSX runtime makes both of these obsolete.
            "react/react-in-jsx-scope": "off",
            "react/jsx-uses-react": "off",
            // The project carries no PropTypes and no type checker, so this
            // rule only ever reports every prop of every component.
            "react/prop-types": "off",
            ...sharedRules,
        },
    },

    // Build config and tooling: runs in Node.
    {
        files: ["*.config.js"],
        ...nodePlugin.configs["flat/recommended-module"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: globals.node,
        },
        rules: sharedRules,
    },

    eslintConfigPrettier,
];
