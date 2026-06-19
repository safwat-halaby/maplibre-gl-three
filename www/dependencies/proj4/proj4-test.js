proj4 = require('./proj4.js');

function ecefToLngLatAlt([x, y, z]) {
    const a = 6378137.0;
    const e2 = 6.69437999014e-3;
    const b = a * Math.sqrt(1 - e2);
    const ep2 = (a * a - b * b) / (b * b);

    const p = Math.sqrt(x * x + y * y);
    const th = Math.atan2(a * z, b * p);
    const lon = Math.atan2(y, x);
    const lat = Math.atan2(z + ep2 * b * Math.pow(Math.sin(th), 3), p - e2 * a * Math.pow(Math.cos(th), 3));
    const n = a / Math.sqrt(1 - e2 * Math.sin(lat) * Math.sin(lat));
    const alt = p / Math.cos(lat) - n;

    return [
        (lon * 180) / Math.PI,
        (lat * 180) / Math.PI
    ];
};

function lngLatToECEF([lng, lat, alt]) {
    const a = 6378137.0;
    const e2 = 6.69437999014e-3;

    const lon = (lng / 180) * Math.PI;
    const latRad = (lat / 180) * Math.PI;
    const sinLat = Math.sin(latRad);
    const cosLat = Math.cos(latRad);
    const n = a / Math.sqrt(1 - e2 * sinLat * sinLat);

    return [
        (n + alt) * cosLat * Math.cos(lon),
        (n + alt) * cosLat * Math.sin(lon),
        (n * (1 - e2) + alt) * sinLat
    ];
}

proj4.defs("EPSG:4978", "+proj=geocent +datum=WGS84 +units=m +no_defs");
const point1 = [35, 34, 10];
testWgs84(point1);

function testWgs84(point) {
    const projConvert = proj4("EPSG:4326", "EPSG:4978", point);
    const manualConvert = lngLatToECEF(point);
    
    const projConvertBack1 = proj4("EPSG:4978", "EPSG:4326", projConvert);
    const projConvertBack2 = proj4("EPSG:4978", "EPSG:4326", manualConvert);
    const manualConvertBack1 = ecefToLngLatAlt(projConvert);
    const manualConvertBack2 = ecefToLngLatAlt(manualConvert);

    console.log(`
        projConvert:        ${projConvert},
        manualConvert:      ${manualConvert},
        projConvertBack1:   ${projConvertBack1},
        projConvertBack2:   ${projConvertBack2},
        manualConvertBack1: ${manualConvertBack1},
        manualConvertBack2: ${manualConvertBack2},
`);
    
}