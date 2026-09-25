This example demonstrates self-hosting `maplibre-gl-three` and all its dependencies.

It renders a 3dtiles model, a  Maplibre Style Spec which contains a river and two streets derived from OpenStreetMap data, a regular threeJS model of a fox, and some spheres that demonstrate coordinate conversions.


## How to run

You need to compile the source of the library, and then run a local web server serving the files in this folder and the files in the `www/dependencies` folder. Here is one way to do it.

In the root directory of the repository:

```sh
npm install
npm run syncDeps
npm run build
cd utils/express-static-server
npm install
node static-server.js 6153
```

Now browse to: http://localhost:6153/examples/basic/maplibreGlThree-selfhost-example/index.html

### Explanation

We first download all the dependencies by running `npm install` in the root directory of the repository. This generates `node_modules`. Then we copy the relevant files from `node_modules` to `www/dependencies` using a helper script with `npm run syncDeps`

We then use a simple web server to serve the generated `www/dependencies/` directory at `http://localhost:6153/dependencies` and the generated `dist/` directory at `http://localhost:6153/library`.

## Library development

If you are making changes to `maplibre-gl-three`, this example can be used as a testing ground mock project, since it directly imports the compiled library. For convenience can run the library compilation in watch mode with `npm run build:watch`. You still have to manually refresh the html page on each change.

Alternatively, the NPM example can be used for the same purpose.
