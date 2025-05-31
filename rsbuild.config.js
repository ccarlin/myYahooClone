import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  source: {
    entry: {
      index: './src/index.js',
    },
  },
  server: {
    port: 3399,
  },
  plugins: [pluginReact()],
});
