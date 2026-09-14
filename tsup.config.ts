import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/library/maplibre-gl-three.ts',
    'src/library/type-wrappers/proj4-wrapper.ts',
    'src/library/type-wrappers/geotiff-wrapper.ts',
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
