import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import reactHooks from 'eslint-plugin-react-hooks';

const eslintConfig = [{
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "e2e/.report/**"]
}, ...nextCoreWebVitals, ...nextTypescript,
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
