import js from '@eslint/js';
import pluginNext from '@next/eslint-plugin-next';
import parser from '@typescript-eslint/parser';

export default [
  {
    name: 'ESLint Config - Next.js',
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@next/next': pluginNext,
    },
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'dist/**'
    ],
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
    },
  },
];
