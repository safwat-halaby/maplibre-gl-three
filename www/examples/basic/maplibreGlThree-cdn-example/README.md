This is a minimal example project which depends on `maplibre-gl-three` and loads all dependencies from a CDN. It does not require a build step.

The code loads a 3dtiles model and a basic Maplibre Style Spec which contains a river and two streets derived from OpenStreetMap data. 

To run the project all you need is to serve this directory from an http server.

One way to do it is to execute this from the repository root directory:

```sh
npm install --prefix utils/express-static-server
node utils/express-static-server/static-server.js 6153
```

Now browse to http://localhost:6153/examples/basic/maplibreGlThree-cdn-example/index.html

