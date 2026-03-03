import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  optimizeDeps: {
    include: ['common-types', 'tray-shared'],
  },
  build: {
    commonjsOptions: {
      include: [/common-types/, /tray-shared/, /node_modules/],
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: './dist/**/*',
          dest: 'renderer/',
        },
      ],
      structured: true,
    }),
  ],
});
