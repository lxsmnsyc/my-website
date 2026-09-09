import lxsmnsyc from '@lxsmnsyc/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
  ...lxsmnsyc,
  ignorePatterns: ['dist'],
  rules: {
    ...lxsmnsyc.rules,
    // Solid assigns element refs through the `ref` attribute, so a `let x!:
    // HTMLElement` declaration is never written to in the source itself.
    'no-unassigned-vars': 'off',
  },
});
