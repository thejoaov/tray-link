import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config
export default defineConfig(({ mode }) => ({
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
    // Only copy the web export into the build output for production.
    // In dev mode the renderer loads from http://localhost:8081, and the
    // static-copy plugin's file watcher causes the watch-mode build to hang.
    ...(mode === 'production'
      ? [
          viteStaticCopy({
            targets: [
              {
                src: './dist/**/*',
                dest: 'renderer/',
              },
            ],
            structured: true,
          }),
        ]
      : []),
  ],
}));
