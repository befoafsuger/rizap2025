// eslint.config.cjs
const { defineConfig } = require('eslint/config')
const eslint = require('@eslint/js')
const tseslint = require('typescript-eslint')

module.exports = defineConfig([
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'eslint.config.cjs'],
  },
])
