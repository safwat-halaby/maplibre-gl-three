This example demonstrates using `maplibre-gl-three` with NPM and webpack. It's a minimal example which loads a 3dtiles model and a basic Maplibre Style Spec which contains a river and two streets derived from OpenStreetMap data. 

You can run it with:

```sh
npm install
npm start
```

## Library development

If you are making changes to `maplibre-gl-three`, this example can be used as a testing ground mock project. You can point this example to use your local copy of `maplibre-gl-three`. 

First, don't forget to build `maplibre-gl-three` (See the root directory README), then:

```sh
npm run local_dependency
npm start
```

Note that the first command internally runs `npm install` so no need to do that.

To reset this, and make this example point again to the officially published `maplibre-gl-three`, execute this:

```sh
npm run registry_dependency
npm start
```

Again, `npm install` runs automatically.

Alternatively, you can use the selfhost example for the same purpose.
