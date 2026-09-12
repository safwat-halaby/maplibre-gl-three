import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/library/maplibre-gl-three.ts',
    'src/library/proj4-wrapper.ts',
    'src/library/geotiff-wrapper.ts',
  ],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: [
    '3d-tiles-renderer',
    'maplibre-gl',
    'geotiff',
    'proj4',
    'three',
    /^three\//,
  ],
});
