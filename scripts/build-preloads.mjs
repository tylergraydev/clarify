import { build } from 'esbuild';

const sharedConfig = {
  bundle: true,
  external: ['electron'],
  format: 'cjs',
  platform: 'node',
  sourcemap: true,
  target: 'es2022',
};

await Promise.all([
  build({
    ...sharedConfig,
    entryPoints: ['electron/preload.ts'],
    outfile: 'electron-dist/electron/preload.js',
  }),
  build({
    ...sharedConfig,
    entryPoints: ['electron/debug-window/preload.ts'],
    outfile: 'electron-dist/electron/debug-window/preload.js',
  }),
]);

console.log('Preload scripts bundled successfully.');
