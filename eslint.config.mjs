import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parser: tseslint.parser,
		},
	},
	{
		files: ['**/*.ts'],
	},
	{
		rules: {
			'no-console': 'warn',
			semi: 'error',
			'no-debugger': 'warn',
			quotes: ['warn', 'single'],
			'@typescript-eslint/no-empty-object-type': 'off',
		},
	},
	{
		files: ['**/server.js'],
		rules: {
			'no-undef': 'off',
			'no-console': 'off',
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
	{
		files: ['webpack.config.js'],
		rules: {
			'no-undef': 'off',
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
);
