
## Development

The TypeScript source code lives in `src/library`. To generate the library in the `dist/` folder:

```
npm install
npm run syncDeps
npm run build:watch
```

*...or `npm run build` for a one-time generation*

For subsequent runs, `npm run build:watch` is enough as long as dependencies are unmodified.

You probably also want to run a basic browser frontend project in parallel, which uses your local version of the `dist/` folder as a dependency. There are 2 methods:

1. Use [www/examples/basic/maplibreGlThree-npm-example](https://github.com/safwat-halaby/maplibre-gl-three/tree/master/www/examples/basic/maplibreGlThree-npm-example).
  - Point that project to the local `dist` files rather than the npm registry by running `npm run local_dependency`
  - Then run that project according to its readme.

2. Use [maplibreGlThree-selfhost-example](https://github.com/safwat-halaby/maplibre-gl-three/tree/master/www/examples/basic/maplibreGlThree-selfhost-example). Run `./node-static-server.sh` and browse to `http://localhost:6153/examples/basic/maplibreGlThree-selfhost-example/index.html`.

In either case refresh your page after changing things in the library's source code.

## Build the documentation

Install the Python documentation dependencies, then generate the API reference and site:

```sh
python -m pip install -r docs/requirements.txt
npm run docs:api
mkdocs serve
```

For a production-style validation build:

```sh
npm run docs
```

The TypeDoc output is generated in `docs/api/` and is not committed to the repository.

To update the pinned Python documentation dependencies after editing `docs/requirements.in`:

```sh
python -m pip install uv
python -m uv pip compile --python-version 3.12 --output-file docs/requirements.txt docs/requirements.in
```
