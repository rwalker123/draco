module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    // Add custom rules here
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    '@typescript-eslint/no-namespace': ['error', { 'allowDeclarations': true }],
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'src/generated/',
    '*.generated.*',
    '*.d.ts'
  ],
}; 