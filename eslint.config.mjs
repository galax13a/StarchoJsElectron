import globals from './scripts/eslint-globals.mjs';

export default [
  { ignores: ['node_modules/**', 'dist/**', '.git/**', '.husky/_/**'] },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals },
    rules: {
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-unreachable': 'error',
      'no-undef': 'error',
    },
  },
];
