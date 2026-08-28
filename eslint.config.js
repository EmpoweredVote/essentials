import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    // Node, not browser: `process` and friends are legitimate here.
    files: ['*.config.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    extends: [js.configs.recommended],
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: { react },
    rules: {
      // Teaches no-unused-vars that JSX references an identifier. Without it,
      // anything used only as a JSX member expression (`<IconComponent.Foo />`)
      // is reported unused — a false positive that deletes live code if you
      // trust it. IconOverlay.jsx was already affected.
      'react/jsx-uses-vars': 'error',
      // A fast-refresh ergonomics hint, not a correctness rule — a mixed-export
      // file reloads less gracefully in dev but behaves identically. Warn, so it
      // stays visible without blocking CI on an export-shape preference.
      // Matches the CompassV2 config.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // `_` marks a deliberately ignored positional argument.
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' },
      ],
    },
  },
])
