import solidLabels from 'babel-plugin-solid-labels';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [
    solidPlugin({
      babel: {
        plugins: [[solidLabels, { dev: false }]],
      },
    }),
  ],
});
