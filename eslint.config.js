import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'pb_data', 'seed']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Variabel yang sengaja tidak dipakai ditandai dengan awalan "_".
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // Migrasi PocketBase memakai global yang disuntikkan server
    // (migrate, Collection, Field, Record).
    files: ['pb_migrations/**/*.js'],
    languageOptions: {
      globals: {
        migrate: 'readonly',
        Collection: 'readonly',
        Field: 'readonly',
        Record: 'readonly',
      },
    },
  },
  {
    // File `lib/` berisi context + provider + hook dalam satu file; pola ini
    // memang memicu peringatan fast-refresh tetapi tidak masalah saat runtime.
    files: ['src/lib/**/*.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
