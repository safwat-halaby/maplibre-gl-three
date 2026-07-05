This example demonstrates self-hosting `maplibre-gl-three` and all its dependencies.

## How to run

In the root directory of the repository:

```sh
npm install
node utils/update_dependencies.js
cd utils/express-static-server
npm install
node static-server.js 6153
```

Now browse to: http://localhost:6153/examples/basic/maplibreGlThree-selfhost-example/index.html

## Explanation

We first download all the dependencies by running `npm install` in the root directory of the repository. This generates `node_modules`. Then we copy the relevant files from `node_modules` to `www/dependencies` using a helper script `update_depdeencies.js`.

We then use a simple web server to serve [www/dependencies](../../../../www/dependencies/) at `http://localhost:6153/dependencies` and [src/library](../../../../src/library/) at `http://localhost:6153/library`.