import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  // Base recommended rules
  js.configs.recommended,

  // TypeScript files configuration
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      // Custom rules matching backend's stricter pattern
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
    },
  },

  // Ignore patterns
  {
    ignores: ['node_modules/', 'dist/', '*.d.ts'],
  },
];
