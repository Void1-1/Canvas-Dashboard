// @ts-check
const nextConfig = require('eslint-config-next');

module.exports = [
  ...nextConfig,
  {
    rules: {
      // React Compiler rules that flag valid Next.js server component patterns
      // (JSX in try/catch, setState in effects, pure function checks)
      'react-hooks/error-boundaries': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];
