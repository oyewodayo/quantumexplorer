import globals from 'globals';

export default [
  { ignores: ['dist/**', 'public/**', 'node_modules/**'] },
  {
    files: ['src/**/*.{js,jsx}', 'tests/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: { 'no-undef': 'error' },
  },
];
