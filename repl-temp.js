import proj4 from 'proj4';
proj4.defs("EPSG:4978", "+proj=geocent +datum=WGS84 +units=m +no_defs");
let testPoint = [0, 90, 0];
let test3dPoint = proj4("EPSG:4326", "EPSG:4978", testPoint);
console.log(`testPoint: ${testPoint}, test3dPoint: ${test3dPoint}`);




