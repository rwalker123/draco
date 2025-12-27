import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  // Base recommended rules
  js.configs.recommended,

  // TypeScript files configuration
  {
    files: ['src/**/*.{js,ts}'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
        Express: 'readonly',
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      // Custom rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
    },
  },

  // TypeScript files - disable no-undef as TypeScript handles this better
  {
    files: ['**/*.ts'],
    rules: {
      'no-undef': 'off',
    },
  },

  // Test files configuration
  {
    files: ['**/*.test.ts', '**/*.test.js', '**/__tests__/**/*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Ignore patterns
  {
    ignores: ['node_modules/', 'dist/', 'src/generated/', '*.generated.*', '*.d.ts'],
  },
];
