module.exports = {
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {},
  },
  plugins: ['prettier'],
  rules: {
    semi: 2,
    'prettier/prettier': 'warn',
    'no-unused-vars': 'warn',
    'no-undefined': 'warn',
  },
  env: {
    browser: true,
  },
};
