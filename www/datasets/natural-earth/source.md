Natural Earth data downloaded from `https://www.naturalearthdata.com/downloads/10m-raster-data/10m-natural-earth-1/`.

I picked "Natural Earth I with Shaded Relief, Water, and Drainages, large size" aka NE1_HR_LC_SR_W_DR.zip

Note: The ones without water seem to have misaligned landmass.

Web mercator conversion:

```sh
gdal raster tile --min-zoom 0 --max-zoom 4 --tiling-scheme WebMercatorQuad --input NE1_HR_LC_SR_W_DR\NE1_HR_LC_SR_W_DR.tif --output WebMercatorQuad
```

Plate Carree conversion:

```sh
gdal raster tile --min-zoom 0 --max-zoom 2 --tiling-scheme GoogleCRS84Quad --input NE1_HR_LC_SR_W_DR\NE1_HR_LC_SR_W_DR.tif --output GoogleCRS84Quad
```

Date is early 2026.

License: Natural earth is a Public Domain map dataset.