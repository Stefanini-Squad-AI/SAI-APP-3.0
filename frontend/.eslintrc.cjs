module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'coverage', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': 'off',
    'react/prop-types': 'warn',
    'no-unused-vars': 'warn',
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.test.jsx', 'src/setupTests.js'],
      env: {
        jest: true,
        node: true,
      },
      rules: {
        'no-unused-vars': 'off',
      },
    },
    {
      files: ['vite.config.js', 'jest.config.js', '__mocks__/**/*.js'],
      env: {
        node: true,
      },
    },
    {
      files: ['src/pages/admin/MessagesPage.jsx'],
      rules: {
        'react/prop-types': 'off',
      },
    },
  ],
}
