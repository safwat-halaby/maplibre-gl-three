
## Development

The TypeScript source code lives in `src/library`. To generate the library in the `dist/` folder:

```
npm install
npm syncDeps
npm run build:watch
```

*...or `npm run build` for a one-time generation*

For consequent runs, `npm run build:watch` is enough as long as dependencies are unmodified. 

You probably also want run a basic browser frontend project in parallel, which uses your local version of the `dist/` folder as a dependency. There are 2 methods:

1. Use [www/examples/basic/maplibreGlThree-npm-example](www/examples/basic/maplibreGlThree-npm-example/).
  - Point that project to the local `dist` files rather than the npm registry by running `npm run local_dependency`
  - Then run that project according to [its readme](www/examples/basic/maplibreGlThree-npm-example/README.md).

2. Use [maplibreGlthree-selfhost-example](www/examples/basic/maplibreGlThree-selfhost-example). Run `node-static-server.sh` and browse to `http://localhost:6153/examples/basic/maplibreGlThree-selfhost-example/index.html`.

In either case refresh your page after changing things in the library's source code.
