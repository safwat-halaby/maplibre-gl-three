import { f as ot, e as Tt } from "./constants-Cj07Qhs1.js";
import { MathUtils as D, Spherical as mt, Vector3 as u, Matrix4 as R, Sphere as Et, Ray as dt, Euler as St, Box3 as yt, Plane as wt, TextureUtils as zt } from "three";
import { estimateBytesUsed as Ft } from "three/examples/jsm/utils/BufferGeometryUtils.js";
const b = /* @__PURE__ */ new mt(), et = /* @__PURE__ */ new u(), _t = {};
function xt(c) {
  const { x: t, y: i, z: o } = c;
  c.x = o, c.y = t, c.z = i;
}
function Ct(c) {
  const { x: t, y: i, z: o } = c;
  c.z = t, c.x = i, c.y = o;
}
function gt(c) {
  return -(c - Math.PI / 2);
}
function J(c) {
  return -c + Math.PI / 2;
}
function Rt(c, t, i = {}) {
  return b.theta = t, b.phi = J(c), et.setFromSpherical(b), b.setFromVector3(et), i.lat = gt(b.phi), i.lon = b.theta, i;
}
function st(c, t = "E", i = "W") {
  const o = c < 0 ? i : t;
  c = Math.abs(c);
  const e = ~~c, s = (c - e) * 60, n = ~~s, l = ~~((s - n) * 60);
  return `${e}° ${n}' ${l}" ${o}`;
}
function bt(c, t, i = !1) {
  const o = Rt(c, t, _t);
  let e, s;
  return i ? (e = `${(D.RAD2DEG * o.lat).toFixed(4)}°`, s = `${(D.RAD2DEG * o.lon).toFixed(4)}°`) : (e = st(D.RAD2DEG * o.lat, "N", "S"), s = st(D.RAD2DEG * o.lon, "E", "W")), `${e} ${s}`;
}
const Ut = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  latitudeToSphericalPhi: J,
  sphericalPhiToLatitude: gt,
  swapToGeoFrame: xt,
  swapToThreeFrame: Ct,
  toLatLonString: bt
}, Symbol.toStringTag, { value: "Module" })), nt = /* @__PURE__ */ new mt(), z = /* @__PURE__ */ new u(), x = /* @__PURE__ */ new u(), Y = /* @__PURE__ */ new u(), P = /* @__PURE__ */ new R(), S = /* @__PURE__ */ new R(), rt = /* @__PURE__ */ new R(), Z = /* @__PURE__ */ new Et(), g = /* @__PURE__ */ new St(), at = /* @__PURE__ */ new u(), lt = /* @__PURE__ */ new u(), ct = /* @__PURE__ */ new u(), _ = /* @__PURE__ */ new u(), O = /* @__PURE__ */ new dt(), vt = 1e-12, At = 0.1, q = 0, ht = 1, U = 2;
class Mt {
  constructor(t = 1, i = 1, o = 1) {
    this.name = "", this.radius = new u(t, i, o);
  }
  intersectRay(t, i) {
    return P.makeScale(...this.radius).invert(), Z.center.set(0, 0, 0), Z.radius = 1, O.copy(t).applyMatrix4(P), O.intersectSphere(Z, i) ? (P.makeScale(...this.radius), i.applyMatrix4(P), i) : null;
  }
  // returns a frame with Z indicating altitude, Y pointing north, X pointing east
  getEastNorthUpFrame(t, i, o, e) {
    return o.isMatrix4 && (e = o, o = 0, console.warn('Ellipsoid: The signature for "getEastNorthUpFrame" has changed.')), this.getEastNorthUpAxes(t, i, at, lt, ct), this.getCartographicToPosition(t, i, o, _), e.makeBasis(at, lt, ct).setPosition(_);
  }
  // returns a frame with z indicating altitude and az, el, roll rotation within that frame
  // - azimuth: measured off of true north, increasing towards "east" (z-axis)
  // - elevation: measured off of the horizon, increasing towards sky (x-axis)
  // - roll: rotation around northern axis (y-axis)
  getOrientedEastNorthUpFrame(t, i, o, e, s, n, a) {
    return this.getObjectFrame(t, i, o, e, s, n, a, q);
  }
  // returns a frame similar to the ENU frame but rotated to match three.js object and camera conventions
  // OBJECT_FRAME: oriented such that "+Y" is up and "+Z" is forward.
  // CAMERA_FRAME: oriented such that "+Y" is up and "-Z" is forward.
  getObjectFrame(t, i, o, e, s, n, a, l = U) {
    return this.getEastNorthUpFrame(t, i, o, P), g.set(s, n, -e, "ZXY"), a.makeRotationFromEuler(g).premultiply(P), l === ht ? (g.set(Math.PI / 2, 0, 0, "XYZ"), S.makeRotationFromEuler(g), a.multiply(S)) : l === U && (g.set(-Math.PI / 2, 0, Math.PI, "XYZ"), S.makeRotationFromEuler(g), a.multiply(S)), a;
  }
  getCartographicFromObjectFrame(t, i, o = U) {
    return o === ht ? (g.set(-Math.PI / 2, 0, 0, "XYZ"), S.makeRotationFromEuler(g).premultiply(t)) : o === U ? (g.set(-Math.PI / 2, 0, Math.PI, "XYZ"), S.makeRotationFromEuler(g).premultiply(t)) : S.copy(t), _.setFromMatrixPosition(S), this.getPositionToCartographic(_, i), this.getEastNorthUpFrame(i.lat, i.lon, 0, P).invert(), S.premultiply(P), g.setFromRotationMatrix(S, "ZXY"), i.azimuth = -g.z, i.elevation = g.x, i.roll = g.y, i;
  }
  getEastNorthUpAxes(t, i, o, e, s, n = _) {
    this.getCartographicToPosition(t, i, 0, n), this.getCartographicToNormal(t, i, s), o.set(-n.y, n.x, 0).normalize(), e.crossVectors(s, o).normalize();
  }
  // azimuth: measured off of true north, increasing towards "east"
  // elevation: measured off of the horizon, increasing towards sky
  // roll: rotation around northern axis
  getAzElRollFromRotationMatrix(t, i, o, e, s = q) {
    return console.warn('Ellipsoid: "getAzElRollFromRotationMatrix" is deprecated. Use "getCartographicFromObjectFrame", instead.'), this.getCartographicToPosition(t, i, 0, _), rt.copy(o).setPosition(_), this.getCartographicFromObjectFrame(rt, e, s), delete e.height, delete e.lat, delete e.lon, e;
  }
  getRotationMatrixFromAzElRoll(t, i, o, e, s, n, a = q) {
    return console.warn('Ellipsoid: "getRotationMatrixFromAzElRoll" function has been deprecated. Use "getObjectFrame", instead.'), this.getObjectFrame(t, i, 0, o, e, s, n, a), n.setPosition(0, 0, 0), n;
  }
  getFrame(t, i, o, e, s, n, a, l = q) {
    return console.warn('Ellipsoid: "getFrame" function has been deprecated. Use "getObjectFrame", instead.'), this.getObjectFrame(t, i, n, o, e, s, a, l);
  }
  getCartographicToPosition(t, i, o, e) {
    this.getCartographicToNormal(t, i, z);
    const s = this.radius;
    x.copy(z), x.x *= s.x ** 2, x.y *= s.y ** 2, x.z *= s.z ** 2;
    const n = Math.sqrt(z.dot(x));
    return x.divideScalar(n), e.copy(x).addScaledVector(z, o);
  }
  getPositionToCartographic(t, i) {
    this.getPositionToSurfacePoint(t, x), this.getPositionToNormal(t, z);
    const o = Y.subVectors(t, x);
    return i.lon = Math.atan2(z.y, z.x), i.lat = Math.asin(z.z), i.height = Math.sign(o.dot(t)) * o.length(), i;
  }
  getCartographicToNormal(t, i, o) {
    return nt.set(1, J(t), i), o.setFromSpherical(nt).normalize(), xt(o), o;
  }
  getPositionToNormal(t, i) {
    const o = this.radius;
    return i.copy(t), i.x /= o.x ** 2, i.y /= o.y ** 2, i.z /= o.z ** 2, i.normalize(), i;
  }
  getPositionToSurfacePoint(t, i) {
    const o = this.radius, e = 1 / o.x ** 2, s = 1 / o.y ** 2, n = 1 / o.z ** 2, a = t.x * t.x * e, l = t.y * t.y * s, p = t.z * t.z * n, h = a + l + p, w = Math.sqrt(1 / h), f = x.copy(t).multiplyScalar(w);
    if (h < At)
      return isFinite(w) ? i.copy(f) : null;
    const E = Y.set(
      f.x * e * 2,
      f.y * s * 2,
      f.z * n * 2
    );
    let m = (1 - w) * t.length() / (0.5 * E.length()), y = 0, k, K, v, A, N, L, V, X, Q, tt, it;
    do {
      m -= y, v = 1 / (1 + m * e), A = 1 / (1 + m * s), N = 1 / (1 + m * n), L = v * v, V = A * A, X = N * N, Q = L * v, tt = V * A, it = X * N, k = a * L + l * V + p * X - 1, K = a * Q * e + l * tt * s + p * it * n;
      const Pt = -2 * K;
      y = k / Pt;
    } while (Math.abs(k) > vt);
    return i.set(
      t.x * v,
      t.y * A,
      t.z * N
    );
  }
  calculateHorizonDistance(t, i) {
    const o = this.calculateEffectiveRadius(t);
    return Math.sqrt(2 * o * i + i ** 2);
  }
  calculateEffectiveRadius(t) {
    const i = this.radius.x, e = 1 - this.radius.z ** 2 / i ** 2, s = t * D.DEG2RAD, n = Math.sin(s) ** 2;
    return i / Math.sqrt(1 - e * n);
  }
  getPositionElevation(t) {
    this.getPositionToSurfacePoint(t, x);
    const i = Y.subVectors(t, x);
    return Math.sign(i.dot(t)) * i.length();
  }
  // Returns an estimate of the closest point on the ellipsoid to the ray. Returns
  // the surface intersection if they collide.
  closestPointToRayEstimate(t, i) {
    return this.intersectRay(t, i) ? i : (P.makeScale(...this.radius).invert(), O.copy(t).applyMatrix4(P), x.set(0, 0, 0), O.closestPointToPoint(x, i).normalize(), P.makeScale(...this.radius), i.applyMatrix4(P));
  }
  copy(t) {
    return this.radius.copy(t.radius), this;
  }
  clone() {
    return new this.constructor().copy(this);
  }
}
const Nt = new Mt(ot, ot, Tt);
Nt.name = "WGS84 Earth";
const j = /* @__PURE__ */ new u(), $ = /* @__PURE__ */ new u(), M = /* @__PURE__ */ new u(), G = /* @__PURE__ */ new dt();
class jt {
  constructor(t = new yt(), i = new R()) {
    this.box = t.clone(), this.transform = i.clone(), this.inverseTransform = new R(), this.points = new Array(8).fill().map(() => new u()), this.planes = new Array(6).fill().map(() => new wt());
  }
  copy(t) {
    return this.box.copy(t.box), this.transform.copy(t.transform), this.update(), this;
  }
  clone() {
    return new this.constructor().copy(this);
  }
  /**
   * Clamps the given point within the bounds of this OBB
   * @param {Vector3} point
   * @param {Vector3} result
   * @returns {Vector3}
   */
  clampPoint(t, i) {
    return i.copy(t).applyMatrix4(this.inverseTransform).clamp(this.box.min, this.box.max).applyMatrix4(this.transform);
  }
  /**
   * Returns the distance from any edge of this OBB to the specified point.
   * If the point lies inside of this box, the distance will be 0.
   * @param {Vector3} point
   * @returns {number}
   */
  distanceToPoint(t) {
    return this.clampPoint(t, M).distanceTo(t);
  }
  containsPoint(t) {
    return M.copy(t).applyMatrix4(this.inverseTransform), this.box.containsPoint(M);
  }
  // returns boolean indicating whether the ray has intersected the obb
  intersectsRay(t) {
    return G.copy(t).applyMatrix4(this.inverseTransform), G.intersectsBox(this.box);
  }
  // Sets "target" equal to the intersection point.
  // Returns "null" if no intersection found.
  intersectRay(t, i) {
    return G.copy(t).applyMatrix4(this.inverseTransform), G.intersectBox(this.box, i) ? (i.applyMatrix4(this.transform), i) : null;
  }
  update() {
    const { points: t, inverseTransform: i, transform: o, box: e } = this;
    i.copy(o).invert();
    const { min: s, max: n } = e;
    let a = 0;
    for (let l = -1; l <= 1; l += 2)
      for (let p = -1; p <= 1; p += 2)
        for (let h = -1; h <= 1; h += 2)
          t[a].set(
            l < 0 ? s.x : n.x,
            p < 0 ? s.y : n.y,
            h < 0 ? s.z : n.z
          ).applyMatrix4(o), a++;
    this.updatePlanes();
  }
  updatePlanes() {
    j.copy(this.box.min).applyMatrix4(this.transform), $.copy(this.box.max).applyMatrix4(this.transform), M.set(0, 0, 1).transformDirection(this.transform), this.planes[0].setFromNormalAndCoplanarPoint(M, j), this.planes[1].setFromNormalAndCoplanarPoint(M, $).negate(), M.set(0, 1, 0).transformDirection(this.transform), this.planes[2].setFromNormalAndCoplanarPoint(M, j), this.planes[3].setFromNormalAndCoplanarPoint(M, $).negate(), M.set(1, 0, 0).transformDirection(this.transform), this.planes[4].setFromNormalAndCoplanarPoint(M, j), this.planes[5].setFromNormalAndCoplanarPoint(M, $).negate();
  }
  intersectsSphere(t) {
    return this.clampPoint(t.center, M), M.distanceToSquared(t.center) <= t.radius * t.radius;
  }
  intersectsFrustum(t) {
    return this._intersectsPlaneShape(t.planes, t.points);
  }
  intersectsOBB(t) {
    return this._intersectsPlaneShape(t.planes, t.points);
  }
  // takes a series of 6 planes that define and enclosed shape and the 8 points that lie at the corners
  // of that shape to determine whether the OBB is intersected with.
  _intersectsPlaneShape(t, i) {
    const o = this.points, e = this.planes;
    for (let s = 0; s < 6; s++) {
      const n = t[s];
      let a = -1 / 0;
      for (let l = 0; l < 8; l++) {
        const p = o[l], h = n.distanceToPoint(p);
        a = a < h ? h : a;
      }
      if (a < 0)
        return !1;
    }
    for (let s = 0; s < 6; s++) {
      const n = e[s];
      let a = -1 / 0;
      for (let l = 0; l < 8; l++) {
        const p = i[l], h = n.distanceToPoint(p);
        a = a < h ? h : a;
      }
      if (a < 0)
        return !1;
    }
    return !0;
  }
}
const W = 1e-13, I = Math.PI, H = I / 2, B = /* @__PURE__ */ new u(), C = /* @__PURE__ */ new u(), T = /* @__PURE__ */ new u(), r = /* @__PURE__ */ new u(), d = /* @__PURE__ */ new R(), Bt = /* @__PURE__ */ new yt(), pt = /* @__PURE__ */ new R();
function F(c, t) {
  t.radius = Math.max(t.radius, c.distanceToSquared(t.center));
}
function ut(c) {
  return c.x !== c.y;
}
class $t extends Mt {
  constructor(t = 1, i = 1, o = 1, e = -H, s = H, n = 0, a = 2 * I, l = 0, p = 0) {
    super(t, i, o), this.latStart = e, this.latEnd = s, this.lonStart = n, this.lonEnd = a, this.heightStart = l, this.heightEnd = p;
  }
  getBoundingBox(t, i) {
    ut(this.radius) && console.warn("EllipsoidRegion: Triaxial ellipsoids are not supported.");
    const {
      latStart: o,
      latEnd: e,
      lonStart: s,
      lonEnd: n,
      heightStart: a,
      heightEnd: l
    } = this, p = (o + e) * 0.5, h = (s + n) * 0.5, w = o > 0, f = e < 0;
    let E;
    w ? E = o : f ? E = e : E = 0;
    const { min: m, max: y } = t;
    m.setScalar(1 / 0), y.setScalar(-1 / 0), n - s <= I ? (this.getCartographicToNormal(p, h, T), C.set(0, 0, 1), B.crossVectors(C, T).normalize(), C.crossVectors(T, B).normalize(), i.makeBasis(B, C, T), d.copy(i).invert(), this.getCartographicToPosition(E, s, l, r).applyMatrix4(d), y.x = Math.abs(r.x), m.x = -y.x, this.getCartographicToPosition(e, s, l, r).applyMatrix4(d), y.y = r.y, this.getCartographicToPosition(e, h, l, r).applyMatrix4(d), y.y = Math.max(r.y, y.y), this.getCartographicToPosition(o, s, l, r).applyMatrix4(d), m.y = r.y, this.getCartographicToPosition(o, h, l, r).applyMatrix4(d), m.y = Math.min(r.y, m.y), this.getCartographicToPosition(p, h, l, r).applyMatrix4(d), y.z = r.z, this.getCartographicToPosition(o, s, a, r).applyMatrix4(d), m.z = r.z, this.getCartographicToPosition(e, s, a, r).applyMatrix4(d), m.z = Math.min(r.z, m.z)) : (this.getCartographicToPosition(E, h, l, T), T.z = 0, T.length() < 1e-10 ? T.set(1, 0, 0) : T.normalize(), C.set(0, 0, 1), B.crossVectors(T, C).normalize(), i.makeBasis(B, C, T), d.copy(i).invert(), this.getCartographicToPosition(E, h + H, l, r).applyMatrix4(d), y.x = Math.abs(r.x), m.x = -y.x, this.getCartographicToPosition(e, 0, f ? a : l, r).applyMatrix4(d), y.y = r.y, this.getCartographicToPosition(o, 0, w ? a : l, r).applyMatrix4(d), m.y = r.y, this.getCartographicToPosition(E, h, l, r).applyMatrix4(d), y.z = r.z, this.getCartographicToPosition(E, n, l, r).applyMatrix4(d), m.z = r.z), t.getCenter(r), t.min.sub(r).multiplyScalar(1 + W), t.max.sub(r).multiplyScalar(1 + W), r.applyMatrix4(i), i.setPosition(r);
  }
  getBoundingSphere(t) {
    ut(this.radius) && console.warn("EllipsoidRegion: Triaxial ellipsoids are not supported."), this.getBoundingBox(Bt, pt), t.center.setFromMatrixPosition(pt), t.radius = 0;
    const {
      latStart: i,
      latEnd: o,
      lonStart: e,
      lonEnd: s,
      heightStart: n,
      heightEnd: a
    } = this, l = (i + o) * 0.5, p = (e + s) * 0.5, h = i > 0, w = o < 0;
    let f;
    h ? f = i : w ? f = o : f = 0, this.getCartographicToPosition(f, e, a, r), F(r, t), this.getCartographicToPosition(o, e, a, r), F(r, t), this.getCartographicToPosition(o, p, a, r), F(r, t), this.getCartographicToPosition(i, e, a, r), F(r, t), this.getCartographicToPosition(i, p, a, r), F(r, t), this.getCartographicToPosition(l, p, a, r), F(r, t), this.getCartographicToPosition(i, e, n, r), F(r, t), s - e > I && (this.getCartographicToPosition(f, p + I, a, r), F(r, t)), t.radius = Math.sqrt(t.radius) * (1 + W);
  }
}
function ft(c) {
  if (!c)
    return 0;
  const { format: t, type: i, image: o } = c, { width: e, height: s } = o;
  let n = zt.getByteLength(e, s, t, i);
  return n *= c.generateMipmaps ? 4 / 3 : 1, n;
}
function Dt(c) {
  const t = /* @__PURE__ */ new Set();
  let i = 0;
  return c.traverse((o) => {
    if (o.geometry && !t.has(o.geometry) && (i += Ft(o.geometry), t.add(o.geometry)), o.material) {
      const e = o.material;
      for (const s in e) {
        const n = e[s];
        n && n.isTexture && !t.has(n) && (i += ft(n), t.add(n));
      }
    }
  }), i;
}
const Gt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  estimateBytesUsed: Dt,
  getTextureByteLength: ft
}, Symbol.toStringTag, { value: "Module" }));
export {
  ht as C,
  q as E,
  Ut as G,
  Gt as M,
  jt as O,
  Nt as W,
  Mt as a,
  $t as b,
  U as c,
  Dt as e,
  ft as g
};
//# sourceMappingURL=MemoryUtils-BD0AS93P.js.map
