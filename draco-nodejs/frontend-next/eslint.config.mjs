import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import reactHooks from 'eslint-plugin-react-hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [{
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"]
}, ...compat.extends('next/core-web-vitals', 'next/typescript'),
  reactHooks.configs.flat['recommended-latest'],
{
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
}, {
  files: ['**/__tests__/**/*'],
  rules: {
    '@next/next/no-img-element': 'off',
  },
}, {
  files: ['e2e/**/*'],
  rules: {
    '@next/next/no-img-element': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'no-empty-pattern': 'off',
  },
}];

export default eslintConfig;
