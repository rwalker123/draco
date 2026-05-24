import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  js.configs.recommended,

  {
    files: ['src/**/*.{js,ts}'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
    },
  },

  {
    files: ['**/*.ts'],
    rules: {
      'no-undef': 'off',
    },
  },

  {
    files: ['**/*.test.ts', '**/*.test.js', '**/__tests__/**/*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  {
    ignores: ['node_modules/', 'dist/', '*.d.ts'],
  },
];
