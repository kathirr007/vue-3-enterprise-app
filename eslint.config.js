import antfu from '@antfu/eslint-config';

export default antfu(
  {
    // unocss: true,
    ignores: [
      'public',
      'dist*'
    ]
  },
  {
    rules: {
      'eslint-comments/no-unlimited-disable': 'off',
      'curly': 'off',
      'antfu/consistent-list-newline': 'off',
      'import/order': 'off',
      'node/prefer-global/process': 'off',
      'no-console': 'off',
      'no-debugger': 'off',
      'ts/method-signature-style': 'off',
      'ts/no-use-before-define': 'off',
      'vue/custom-event-name-casing': 'off',
      'vue/prop-name-casing': ['error', 'camelCase'],
      'vue/no-template-shadow': 'off',
      'unused-imports/no-unused-vars': 'off',
      'vue/no-unused-refs': 'off',
      'style/max-statements-per-line': 'off',
      'style/semi': ['error', 'always'],
      'style/comma-dangle': ['error', 'never'],
      'style/member-delimiter-style': ['error', {
        multiline: {
          delimiter: 'semi',
          requireLast: true
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false
        },
        multilineDetection: 'brackets'
      }],
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'DebuggerStatement',
          message: 'Function expressions are not allowed.'
        }
      ],
      'no-throw-literal': 'off'
    }
  },
  {
    files: [
      'src/**/*.vue'
    ],
    rules: {
      'vue/block-order': ['error', {
        order: ['script', 'template', 'style', 'route', 'i18n']
      }]
    }
  }
);
