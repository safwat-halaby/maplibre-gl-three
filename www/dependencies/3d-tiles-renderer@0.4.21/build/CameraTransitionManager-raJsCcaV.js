import { B as We, T as Ne } from "./B3DMLoaderBase-Cwfi38VH.js";
import { g as ke, r as Be } from "./LoaderBase-2yhE3Jur.js";
import { DefaultLoadingManager as Lt, Matrix4 as I, Vector3 as y, Vector2 as A, MathUtils as v, PointsMaterial as He, BufferGeometry as je, BufferAttribute as st, Color as Ge, Points as Ze, InstancedMesh as qe, Quaternion as it, Group as Pt, Ray as Wt, Sphere as Qe, Frustum as $e, Matrix3 as Ye, LoadingManager as Xe, EventDispatcher as ft, Euler as Ke, Mesh as Je, PlaneGeometry as ti, ShaderMaterial as ei, Plane as De, Raycaster as ii, Clock as we, PerspectiveCamera as te, OrthographicCamera as Ce } from "three";
import { GLTFLoader as Kt } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PNTSLoaderBase as si, I3DMLoaderBase as oi, CMPTLoaderBase as ni } from "./index.core.js";
import { W as vt, O as ee, b as ri, e as ai, a as ci } from "./MemoryUtils-BD0AS93P.js";
class Se extends We {
  constructor(t = Lt) {
    super(), this.manager = t, this.adjustmentTransform = new I();
  }
  parse(t) {
    const e = super.parse(t), i = e.glbBytes.slice().buffer;
    return new Promise((s, o) => {
      const r = this.manager, n = this.fetchOptions, a = r.getHandler("path.gltf") || new Kt(r);
      n.credentials === "include" && n.mode === "cors" && a.setCrossOrigin("use-credentials"), "credentials" in n && a.setWithCredentials(n.credentials === "include"), n.headers && a.setRequestHeader(n.headers);
      let h = this.workingPath;
      !/[\\/]$/.test(h) && h.length && (h += "/");
      const l = this.adjustmentTransform;
      a.parse(i, h, (c) => {
        const { batchTable: p, featureTable: f } = e, { scene: u } = c, d = f.getData("RTC_CENTER", 1, "FLOAT", "VEC3");
        d && (u.position.x += d[0], u.position.y += d[1], u.position.z += d[2]), c.scene.updateMatrix(), c.scene.matrix.multiply(l), c.scene.matrix.decompose(c.scene.position, c.scene.quaternion, c.scene.scale), c.batchTable = p, c.featureTable = f, u.batchTable = p, u.featureTable = f, s(c);
      }, o);
    });
  }
}
function li(m) {
  const t = m >> 11, e = m >> 5 & 63, i = m & 31, s = Math.round(t / 31 * 255), o = Math.round(e / 63 * 255), r = Math.round(i / 31 * 255);
  return [s, o, r];
}
const xt = /* @__PURE__ */ new A();
function hi(m, t, e = new y()) {
  xt.set(m, t).divideScalar(256).multiplyScalar(2).subScalar(1), e.set(xt.x, xt.y, 1 - Math.abs(xt.x) - Math.abs(xt.y));
  const i = v.clamp(-e.z, 0, 1);
  return e.x >= 0 ? e.setX(e.x - i) : e.setX(e.x + i), e.y >= 0 ? e.setY(e.y - i) : e.setY(e.y + i), e.normalize(), e;
}
const ie = {
  RGB: "color",
  POSITION: "position"
};
class Ee extends si {
  constructor(t = Lt) {
    super(), this.manager = t;
  }
  parse(t) {
    return super.parse(t).then(async (e) => {
      const { featureTable: i, batchTable: s } = e, o = new He(), r = i.header.extensions, n = new y();
      let a;
      if (r && r["3DTILES_draco_point_compression"]) {
        const { byteOffset: c, byteLength: p, properties: f } = r["3DTILES_draco_point_compression"], u = this.manager.getHandler("draco.drc");
        if (u == null)
          throw new Error("PNTSLoader: dracoLoader not available.");
        const d = {};
        for (const _ in f)
          if (_ in ie && _ in f) {
            const F = ie[_];
            d[F] = f[_];
          }
        const x = {
          attributeIDs: d,
          attributeTypes: {
            position: "Float32Array",
            color: "Uint8Array"
          },
          useUniqueIDs: !0
        }, E = i.getBuffer(c, p);
        a = await u.decodeGeometry(E, x), a.attributes.color && (o.vertexColors = !0);
      } else {
        const c = i.getData("POINTS_LENGTH"), p = i.getData("POSITION", c, "FLOAT", "VEC3"), f = i.getData("NORMAL", c, "FLOAT", "VEC3"), u = i.getData("NORMAL", c, "UNSIGNED_BYTE", "VEC2"), d = i.getData("RGB", c, "UNSIGNED_BYTE", "VEC3"), x = i.getData("RGBA", c, "UNSIGNED_BYTE", "VEC4"), E = i.getData("RGB565", c, "UNSIGNED_SHORT", "SCALAR"), _ = i.getData("CONSTANT_RGBA", c, "UNSIGNED_BYTE", "VEC4"), F = i.getData("POSITION_QUANTIZED", c, "UNSIGNED_SHORT", "VEC3"), g = i.getData("QUANTIZED_VOLUME_SCALE", c, "FLOAT", "VEC3"), S = i.getData("QUANTIZED_VOLUME_OFFSET", c, "FLOAT", "VEC3");
        if (a = new je(), F) {
          const C = new Float32Array(c * 3);
          for (let T = 0; T < c; T++)
            for (let R = 0; R < 3; R++) {
              const V = 3 * T + R;
              C[V] = F[V] / 65535 * g[R];
            }
          n.x = S[0], n.y = S[1], n.z = S[2], a.setAttribute("position", new st(C, 3, !1));
        } else
          a.setAttribute("position", new st(p, 3, !1));
        if (f !== null)
          a.setAttribute("normal", new st(f, 3, !1));
        else if (u !== null) {
          const C = new Float32Array(c * 3), T = new y();
          for (let R = 0; R < c; R++) {
            const V = u[R * 2], yt = u[R * 2 + 1], j = hi(V, yt, T);
            C[R * 3] = j.x, C[R * 3 + 1] = j.y, C[R * 3 + 2] = j.z;
          }
          a.setAttribute("normal", new st(C, 3, !1));
        }
        if (x !== null)
          a.setAttribute("color", new st(x, 4, !0)), o.vertexColors = !0, o.transparent = !0, o.depthWrite = !1;
        else if (d !== null)
          a.setAttribute("color", new st(d, 3, !0)), o.vertexColors = !0;
        else if (E !== null) {
          const C = new Uint8Array(c * 3);
          for (let T = 0; T < c; T++) {
            const R = li(E[T]);
            for (let V = 0; V < 3; V++) {
              const yt = 3 * T + V;
              C[yt] = R[V];
            }
          }
          a.setAttribute("color", new st(C, 3, !0)), o.vertexColors = !0;
        } else if (_ !== null) {
          const C = new Ge(_[0], _[1], _[2]);
          o.color = C;
          const T = _[3] / 255;
          T < 1 && (o.opacity = T, o.transparent = !0, o.depthWrite = !1);
        }
      }
      const h = new Ze(a, o);
      h.position.copy(n), e.scene = h, e.scene.featureTable = i, e.scene.batchTable = s;
      const l = i.getData("RTC_CENTER", 1, "FLOAT", "VEC3");
      return l && (e.scene.position.x += l[0], e.scene.position.y += l[1], e.scene.position.z += l[2]), e;
    });
  }
}
const Dt = /* @__PURE__ */ new y(), ct = /* @__PURE__ */ new y(), lt = /* @__PURE__ */ new y(), kt = /* @__PURE__ */ new y(), wt = /* @__PURE__ */ new it(), Ct = /* @__PURE__ */ new y(), ht = /* @__PURE__ */ new I(), se = /* @__PURE__ */ new I(), oe = /* @__PURE__ */ new y(), ne = /* @__PURE__ */ new I(), Bt = /* @__PURE__ */ new it(), Ht = {};
function re(m, t, e, i) {
  if (m = m / e * 2 - 1, t = t / e * 2 - 1, i.x = m, i.y = t, i.z = 1 - Math.abs(m) - Math.abs(t), i.z < 0) {
    const s = i.x;
    i.x = (1 - Math.abs(i.y)) * (s >= 0 ? 1 : -1), i.y = (1 - Math.abs(s)) * (i.y >= 0 ? 1 : -1);
  }
  return i.normalize(), i;
}
class Oe extends oi {
  constructor(t = Lt) {
    super(), this.manager = t, this.adjustmentTransform = new I(), this.ellipsoid = vt.clone();
  }
  resolveExternalURL(t) {
    return this.manager.resolveURL(super.resolveExternalURL(t));
  }
  parse(t) {
    return super.parse(t).then((e) => {
      const { featureTable: i, batchTable: s } = e, o = e.glbBytes.slice().buffer;
      return new Promise((r, n) => {
        const a = this.fetchOptions, h = this.manager, l = h.getHandler("path.gltf") || new Kt(h);
        a.credentials === "include" && a.mode === "cors" && l.setCrossOrigin("use-credentials"), "credentials" in a && l.setWithCredentials(a.credentials === "include"), a.headers && l.setRequestHeader(a.headers);
        let c = e.gltfWorkingPath ?? this.workingPath;
        /[\\/]$/.test(c) || (c += "/");
        const p = this.adjustmentTransform;
        l.parse(o, c, (f) => {
          const u = i.getData("INSTANCES_LENGTH");
          let d = i.getData("POSITION", u, "FLOAT", "VEC3");
          const x = i.getData("POSITION_QUANTIZED", u, "UNSIGNED_SHORT", "VEC3"), E = i.getData("QUANTIZED_VOLUME_OFFSET", 1, "FLOAT", "VEC3"), _ = i.getData("QUANTIZED_VOLUME_SCALE", 1, "FLOAT", "VEC3"), F = i.getData("NORMAL_UP", u, "FLOAT", "VEC3"), g = i.getData("NORMAL_RIGHT", u, "FLOAT", "VEC3"), S = i.getData("NORMAL_UP_OCT32P", u, "UNSIGNED_SHORT", "VEC2"), C = i.getData("NORMAL_RIGHT_OCT32P", u, "UNSIGNED_SHORT", "VEC2"), T = i.getData("SCALE_NON_UNIFORM", u, "FLOAT", "VEC3"), R = i.getData("SCALE", u, "FLOAT", "SCALAR"), V = i.getData("RTC_CENTER", 1, "FLOAT", "VEC3"), yt = i.getData("EAST_NORTH_UP");
          if (!d && x) {
            d = new Float32Array(u * 3);
            for (let b = 0; b < u; b++)
              d[b * 3 + 0] = E[0] + x[b * 3 + 0] / 65535 * _[0], d[b * 3 + 1] = E[1] + x[b * 3 + 1] / 65535 * _[1], d[b * 3 + 2] = E[2] + x[b * 3 + 2] / 65535 * _[2];
          }
          const j = new y();
          for (let b = 0; b < u; b++)
            j.x += d[b * 3 + 0] / u, j.y += d[b * 3 + 1] / u, j.z += d[b * 3 + 2] / u;
          const Tt = [], Jt = [];
          f.scene.updateMatrixWorld(), f.scene.traverse((b) => {
            if (b.isMesh) {
              Jt.push(b);
              const { geometry: at, material: Nt } = b, q = new qe(at, Nt, u);
              q.position.copy(j), V && (q.position.x += V[0], q.position.y += V[1], q.position.z += V[2]), Tt.push(q);
            }
          });
          for (let b = 0; b < u; b++) {
            kt.set(
              d[b * 3 + 0] - j.x,
              d[b * 3 + 1] - j.y,
              d[b * 3 + 2] - j.z
            ), wt.identity(), F && g ? (ct.set(
              F[b * 3 + 0],
              F[b * 3 + 1],
              F[b * 3 + 2]
            ), lt.set(
              g[b * 3 + 0],
              g[b * 3 + 1],
              g[b * 3 + 2]
            ), Dt.crossVectors(lt, ct).normalize(), ht.makeBasis(
              lt,
              ct,
              Dt
            ), wt.setFromRotationMatrix(ht)) : S && C && (re(
              S[b * 2 + 0],
              S[b * 2 + 1],
              65535,
              ct
            ), re(
              C[b * 2 + 0],
              C[b * 2 + 1],
              65535,
              lt
            ), Dt.crossVectors(lt, ct).normalize(), ht.makeBasis(
              lt,
              ct,
              Dt
            ), wt.setFromRotationMatrix(ht)), Ct.set(1, 1, 1), T && Ct.set(
              T[b * 3 + 0],
              T[b * 3 + 1],
              T[b * 3 + 2]
            ), R && Ct.multiplyScalar(R[b]);
            for (let at = 0, Nt = Tt.length; at < Nt; at++) {
              const q = Tt[at];
              Bt.copy(wt), yt && (q.updateMatrixWorld(), oe.copy(kt).applyMatrix4(q.matrixWorld), this.ellipsoid.getPositionToCartographic(oe, Ht), this.ellipsoid.getEastNorthUpFrame(Ht.lat, Ht.lon, ne), Bt.setFromRotationMatrix(ne)), ht.compose(kt, Bt, Ct).multiply(p);
              const Le = Jt[at];
              se.multiplyMatrices(ht, Le.matrixWorld), q.setMatrixAt(b, se);
            }
          }
          f.scene.clear(), f.scene.add(...Tt), f.batchTable = s, f.featureTable = i, f.scene.batchTable = s, f.scene.featureTable = i, r(f);
        }, n);
      });
    });
  }
}
class pi extends ni {
  constructor(t = Lt) {
    super(), this.manager = t, this.adjustmentTransform = new I(), this.ellipsoid = vt.clone();
  }
  parse(t) {
    const e = super.parse(t), { manager: i, ellipsoid: s, adjustmentTransform: o } = this, r = [];
    for (const n in e.tiles) {
      const { type: a, buffer: h } = e.tiles[n];
      switch (a) {
        case "b3dm": {
          const l = h.slice(), c = new Se(i);
          c.workingPath = this.workingPath, c.fetchOptions = this.fetchOptions, c.adjustmentTransform.copy(o);
          const p = c.parse(l.buffer);
          r.push(p);
          break;
        }
        case "pnts": {
          const l = h.slice(), c = new Ee(i);
          c.workingPath = this.workingPath, c.fetchOptions = this.fetchOptions;
          const p = c.parse(l.buffer);
          r.push(p);
          break;
        }
        case "i3dm": {
          const l = h.slice(), c = new Oe(i);
          c.workingPath = this.workingPath, c.fetchOptions = this.fetchOptions, c.ellipsoid.copy(s), c.adjustmentTransform.copy(o);
          const p = c.parse(l.buffer);
          r.push(p);
          break;
        }
      }
    }
    return Promise.all(r).then((n) => {
      const a = new Pt();
      return n.forEach((h) => {
        a.add(h.scene);
      }), {
        tiles: n,
        scene: a
      };
    });
  }
}
const bt = /* @__PURE__ */ new I();
class di extends Pt {
  constructor(t) {
    super(), this.isTilesGroup = !0, this.name = "TilesRenderer.TilesGroup", this.tilesRenderer = t, this.matrixWorldInverse = new I();
  }
  raycast(t, e) {
    return this.tilesRenderer.optimizeRaycast ? (this.tilesRenderer.raycast(t, e), !1) : !0;
  }
  updateMatrixWorld(t) {
    if (this.matrixAutoUpdate && this.updateMatrix(), this.matrixWorldNeedsUpdate || t) {
      this.parent === null ? bt.copy(this.matrix) : bt.multiplyMatrices(this.parent.matrixWorld, this.matrix), this.matrixWorldNeedsUpdate = !1;
      const e = bt.elements, i = this.matrixWorld.elements;
      let s = !1;
      for (let o = 0; o < 16; o++) {
        const r = e[o], n = i[o];
        if (Math.abs(r - n) > Number.EPSILON) {
          s = !0;
          break;
        }
      }
      if (s) {
        this.matrixWorld.copy(bt), this.matrixWorldInverse.copy(bt).invert();
        const o = this.children;
        for (let r = 0, n = o.length; r < n; r++)
          o[r].updateMatrixWorld();
      }
    }
  }
  updateWorldMatrix(t, e) {
    this.parent && t && this.parent.updateWorldMatrix(t, !1), this.updateMatrixWorld(!0);
  }
}
const Ie = /* @__PURE__ */ new Wt(), jt = /* @__PURE__ */ new y(), St = [];
function Re(m, t) {
  return m.distance - t.distance;
}
function ze(m, t, e, i) {
  const { scene: s } = m.engineData;
  e.invokeOnePlugin((r) => r.raycastTile && r.raycastTile(m, s, t, i)) || t.intersectObject(s, !0, i);
}
function ui(m, t, e) {
  ze(m, t, e, St), St.sort(Re);
  const i = St[0] || null;
  return St.length = 0, i;
}
function Ae(m) {
  return "traversal" in m;
}
function Fe(m, t, e, i = null) {
  const { group: s, activeTiles: o } = m;
  i === null && (i = Ie, i.copy(e.ray).applyMatrix4(s.matrixWorldInverse));
  const r = [], n = t.children;
  for (let l = 0, c = n.length; l < c; l++) {
    const p = n[l];
    if (!Ae(p) || !p.traversal.used)
      continue;
    p.engineData.boundingVolume.intersectRay(i, jt) !== null && (jt.applyMatrix4(s.matrixWorld), r.push({
      distance: jt.distanceToSquared(e.ray.origin),
      tile: p
    }));
  }
  r.sort(Re);
  let a = null, h = 1 / 0;
  if (o.has(t)) {
    const l = ui(t, e, m);
    l && (a = l, h = l.distance * l.distance);
  }
  for (let l = 0, c = r.length; l < c; l++) {
    const p = r[l], f = p.distance, u = p.tile;
    if (f > h)
      break;
    const d = Fe(m, u, e, i);
    if (d) {
      const x = d.distance * d.distance;
      x < h && (a = d, h = x);
    }
  }
  return a;
}
function Ue(m, t, e, i, s = null) {
  if (!Ae(t))
    return;
  const { group: o, activeTiles: r } = m, { boundingVolume: n } = t.engineData;
  if (s === null && (s = Ie, s.copy(e.ray).applyMatrix4(o.matrixWorldInverse)), !t.traversal.used || !n.intersectsRay(s))
    return;
  r.has(t) && ze(t, e, m, i);
  const a = t.children;
  for (let h = 0, l = a.length; h < l; h++)
    Ue(m, a[h], e, i, s);
}
const Q = /* @__PURE__ */ new y(), $ = /* @__PURE__ */ new y(), Y = /* @__PURE__ */ new y(), ae = /* @__PURE__ */ new y(), ce = /* @__PURE__ */ new y();
class mi {
  constructor() {
    this.sphere = null, this.obb = null, this.region = null, this.regionObb = null;
  }
  intersectsRay(t) {
    const e = this.sphere, i = this.obb || this.regionObb;
    return !(e && !t.intersectsSphere(e) || i && !i.intersectsRay(t));
  }
  intersectRay(t, e = null) {
    const i = this.sphere, s = this.obb || this.regionObb;
    let o = -1 / 0, r = -1 / 0;
    i && t.intersectSphere(i, ae) && (o = i.containsPoint(t.origin) ? 0 : t.origin.distanceToSquared(ae)), s && s.intersectRay(t, ce) && (r = s.containsPoint(t.origin) ? 0 : t.origin.distanceToSquared(ce));
    const n = Math.max(o, r);
    return n === -1 / 0 ? null : (t.at(Math.sqrt(n), e), e);
  }
  distanceToPoint(t) {
    const e = this.sphere, i = this.obb || this.regionObb;
    let s = -1 / 0, o = -1 / 0;
    return e && (s = Math.max(e.distanceToPoint(t), 0)), i && (o = i.distanceToPoint(t)), s > o ? s : o;
  }
  intersectsFrustum(t) {
    const e = this.obb || this.regionObb, i = this.sphere;
    return i && !t.intersectsSphere(i) || e && !e.intersectsFrustum(t) ? !1 : !!(i || e);
  }
  intersectsSphere(t) {
    const e = this.obb || this.regionObb, i = this.sphere;
    return i && !i.intersectsSphere(t) || e && !e.intersectsSphere(t) ? !1 : !!(i || e);
  }
  intersectsOBB(t) {
    const e = this.obb || this.regionObb, i = this.sphere;
    return i && !t.intersectsSphere(i) || e && !e.intersectsOBB(t) ? !1 : !!(i || e);
  }
  getOBB(t, e) {
    const i = this.obb || this.regionObb;
    i ? (t.copy(i.box), e.copy(i.transform)) : (this.getAABB(t), e.identity());
  }
  getAABB(t) {
    if (this.sphere)
      this.sphere.getBoundingBox(t);
    else {
      const e = this.obb || this.regionObb;
      t.copy(e.box).applyMatrix4(e.transform);
    }
  }
  getSphere(t) {
    if (this.sphere)
      t.copy(this.sphere);
    else if (this.region)
      this.region.getBoundingSphere(t);
    else {
      const e = this.obb || this.regionObb;
      e.box.getBoundingSphere(t), t.applyMatrix4(e.transform);
    }
  }
  setObbData(t, e) {
    const i = new ee();
    Q.set(t[3], t[4], t[5]), $.set(t[6], t[7], t[8]), Y.set(t[9], t[10], t[11]);
    const s = Q.length(), o = $.length(), r = Y.length();
    Q.normalize(), $.normalize(), Y.normalize(), s === 0 && Q.crossVectors($, Y), o === 0 && $.crossVectors(Q, Y), r === 0 && Y.crossVectors(Q, $), i.transform.set(
      Q.x,
      $.x,
      Y.x,
      t[0],
      Q.y,
      $.y,
      Y.y,
      t[1],
      Q.z,
      $.z,
      Y.z,
      t[2],
      0,
      0,
      0,
      1
    ).premultiply(e), i.box.min.set(-s, -o, -r), i.box.max.set(s, o, r), i.update(), this.obb = i;
  }
  setSphereData(t, e, i, s, o) {
    const r = new Qe();
    r.center.set(t, e, i), r.radius = s, r.applyMatrix4(o), this.sphere = r;
  }
  setRegionData(t, e, i, s, o, r, n) {
    const a = new ri(
      ...t.radius,
      i,
      o,
      e,
      s,
      r,
      n
    ), h = new ee();
    a.getBoundingBox(h.box, h.transform), h.update(), this.region = a, this.regionObb = h;
  }
}
const fi = /* @__PURE__ */ new Ye();
function gi(m, t, e, i) {
  const s = fi.set(
    m.normal.x,
    m.normal.y,
    m.normal.z,
    t.normal.x,
    t.normal.y,
    t.normal.z,
    e.normal.x,
    e.normal.y,
    e.normal.z
  );
  return i.set(-m.constant, -t.constant, -e.constant), i.applyMatrix3(s.invert()), i;
}
class yi extends $e {
  constructor() {
    super(), this.points = Array(8).fill().map(() => new y());
  }
  setFromProjectionMatrix(t, e) {
    return super.setFromProjectionMatrix(t, e), this.calculateFrustumPoints(), this;
  }
  calculateFrustumPoints() {
    const { planes: t, points: e } = this;
    [
      [t[0], t[3], t[4]],
      // Near top left
      [t[1], t[3], t[4]],
      // Near top right
      [t[0], t[2], t[4]],
      // Near bottom left
      [t[1], t[2], t[4]],
      // Near bottom right
      [t[0], t[3], t[5]],
      // Far top left
      [t[1], t[3], t[5]],
      // Far top right
      [t[0], t[2], t[5]],
      // Far bottom left
      [t[1], t[2], t[5]]
      // Far bottom right
    ].forEach((s, o) => {
      gi(s[0], s[1], s[2], e[o]);
    });
  }
}
const le = /* @__PURE__ */ new I(), he = /* @__PURE__ */ new Ke(), Ve = Symbol("INITIAL_FRUSTUM_CULLED"), Et = /* @__PURE__ */ new I(), Mt = /* @__PURE__ */ new y(), Gt = /* @__PURE__ */ new A(), xi = /* @__PURE__ */ new y(1, 0, 0), bi = /* @__PURE__ */ new y(0, 1, 0);
function pe(m, t) {
  m.traverse((e) => {
    e.frustumCulled = e[Ve] && t;
  });
}
class Vi extends Ne {
  get autoDisableRendererCulling() {
    return this._autoDisableRendererCulling;
  }
  set autoDisableRendererCulling(t) {
    this._autoDisableRendererCulling !== t && (super._autoDisableRendererCulling = t, this.forEachLoadedModel((e) => {
      pe(e, !t);
    }));
  }
  get optimizeRaycast() {
    return this._optimizeRaycast;
  }
  set optimizeRaycast(t) {
    console.warn('TilesRenderer: The "optimizeRaycast" option has been deprecated.'), this._optimizeRaycast = t;
  }
  constructor(...t) {
    super(...t), this.group = new di(this), this.ellipsoid = vt.clone(), this.cameras = [], this.cameraMap = /* @__PURE__ */ new Map(), this.cameraInfo = [], this._optimizeRaycast = !0, this._upRotationMatrix = new I(), this._bytesUsed = /* @__PURE__ */ new WeakMap(), this._autoDisableRendererCulling = !0, this.manager = new Xe(), this._listeners = {};
  }
  addEventListener(t, e) {
    t === "load-tile-set" && (console.warn('TilesRenderer: "load-tile-set" event has been deprecated. Use "load-tileset" instead.'), t = "load-tileset"), ft.prototype.addEventListener.call(this, t, e);
  }
  hasEventListener(t, e) {
    return t === "load-tile-set" && (console.warn('TilesRenderer: "load-tile-set" event has been deprecated. Use "load-tileset" instead.'), t = "load-tileset"), ft.prototype.hasEventListener.call(this, t, e);
  }
  removeEventListener(t, e) {
    t === "load-tile-set" && (console.warn('TilesRenderer: "load-tile-set" event has been deprecated. Use "load-tileset" instead.'), t = "load-tileset"), ft.prototype.removeEventListener.call(this, t, e);
  }
  dispatchEvent(t) {
    "tileset" in t && Object.defineProperty(t, "tileSet", {
      get() {
        return console.warn('TilesRenderer: "event.tileSet" has been deprecated. Use "event.tileset" instead.'), t.tileset;
      },
      enumerable: !1,
      configurable: !0
    }), ft.prototype.dispatchEvent.call(this, t);
  }
  /* Public API */
  getBoundingBox(t) {
    if (!this.root)
      return !1;
    const e = this.root.engineData.boundingVolume;
    return e ? (e.getAABB(t), !0) : !1;
  }
  getOrientedBoundingBox(t, e) {
    if (!this.root)
      return !1;
    const i = this.root.engineData.boundingVolume;
    return i ? (i.getOBB(t, e), !0) : !1;
  }
  getBoundingSphere(t) {
    if (!this.root)
      return !1;
    const e = this.root.engineData.boundingVolume;
    return e ? (e.getSphere(t), !0) : !1;
  }
  forEachLoadedModel(t) {
    this.traverse((e) => {
      const i = e.engineData && e.engineData.scene;
      i && t(i, e);
    }, null, !1);
  }
  raycast(t, e) {
    if (this.root)
      if (t.firstHitOnly) {
        const i = Fe(this, this.root, t);
        i && e.push(i);
      } else
        Ue(this, this.root, t, e);
  }
  hasCamera(t) {
    return this.cameraMap.has(t);
  }
  setCamera(t) {
    const e = this.cameras, i = this.cameraMap;
    return i.has(t) ? !1 : (i.set(t, new A()), e.push(t), this.dispatchEvent({ type: "add-camera", camera: t }), !0);
  }
  setResolution(t, e, i) {
    const s = this.cameraMap;
    if (!s.has(t))
      return !1;
    const o = e.isVector2 ? e.x : e, r = e.isVector2 ? e.y : i, n = s.get(t);
    return (n.width !== o || n.height !== r) && (n.set(o, r), this.dispatchEvent({ type: "camera-resolution-change" })), !0;
  }
  setResolutionFromRenderer(t, e) {
    return e.getSize(Gt), this.setResolution(t, Gt.x, Gt.y);
  }
  deleteCamera(t) {
    const e = this.cameras, i = this.cameraMap;
    if (i.has(t)) {
      const s = e.indexOf(t);
      return e.splice(s, 1), i.delete(t), this.dispatchEvent({ type: "delete-camera", camera: t }), !0;
    }
    return !1;
  }
  /* Overriden */
  loadRootTileset(...t) {
    return super.loadRootTileset(...t).then((e) => {
      const { asset: i, extensions: s = {} } = e;
      switch ((i && i.gltfUpAxis || "y").toLowerCase()) {
        case "x":
          this._upRotationMatrix.makeRotationAxis(bi, -Math.PI / 2);
          break;
        case "y":
          this._upRotationMatrix.makeRotationAxis(xi, Math.PI / 2);
          break;
      }
      if ("3DTILES_ellipsoid" in s) {
        const r = s["3DTILES_ellipsoid"], { ellipsoid: n } = this;
        n.name = r.body, r.radii ? n.radius.set(...r.radii) : n.radius.set(1, 1, 1);
      }
      return e;
    });
  }
  prepareForTraversal() {
    const t = this.group, e = this.cameras, i = this.cameraMap, s = this.cameraInfo;
    for (; s.length > e.length; )
      s.pop();
    for (; s.length < e.length; )
      s.push({
        frustum: new yi(),
        isOrthographic: !1,
        sseDenominator: -1,
        // used if isOrthographic:false
        position: new y(),
        invScale: -1,
        pixelSize: 0
        // used if isOrthographic:true
      });
    Mt.setFromMatrixScale(t.matrixWorldInverse), Math.abs(Math.max(Mt.x - Mt.y, Mt.x - Mt.z)) > 1e-6 && console.warn("ThreeTilesRenderer : Non uniform scale used for tile which may cause issues when calculating screen space error.");
    for (let o = 0, r = s.length; o < r; o++) {
      const n = e[o], a = s[o], h = a.frustum, l = a.position, c = i.get(n);
      (c.width === 0 || c.height === 0) && console.warn("TilesRenderer: resolution for camera error calculation is not set.");
      const p = n.projectionMatrix.elements;
      if (a.isOrthographic = p[15] === 1, a.isOrthographic) {
        const f = 2 / p[0], u = 2 / p[5];
        a.pixelSize = Math.max(u / c.height, f / c.width);
      } else
        a.sseDenominator = 2 / p[5] / c.height;
      Et.copy(t.matrixWorld), Et.premultiply(n.matrixWorldInverse), Et.premultiply(n.projectionMatrix), h.setFromProjectionMatrix(Et), l.set(0, 0, 0), l.applyMatrix4(n.matrixWorld), l.applyMatrix4(t.matrixWorldInverse);
    }
  }
  update() {
    if (super.update(), this.cameras.length === 0 && this.root) {
      let t = !1;
      this.invokeAllPlugins((e) => t = t || !!(e !== this && e.calculateTileViewError)), t === !1 && console.warn("TilesRenderer: no cameras defined. Cannot update 3d tiles.");
    }
  }
  preprocessNode(t, e, i = null) {
    super.preprocessNode(t, e, i);
    const s = new I();
    if (t.transform) {
      const n = t.transform;
      for (let a = 0; a < 16; a++)
        s.elements[a] = n[a];
    }
    i && s.premultiply(i.engineData.transform);
    const o = new I().copy(s).invert(), r = new mi();
    "sphere" in t.boundingVolume && r.setSphereData(...t.boundingVolume.sphere, s), "box" in t.boundingVolume && r.setObbData(t.boundingVolume.box, s), "region" in t.boundingVolume && r.setRegionData(this.ellipsoid, ...t.boundingVolume.region), t.engineData.transform = s, t.engineData.transformInverse = o, t.engineData.boundingVolume = r, t.engineData.geometry = null, t.engineData.materials = null, t.engineData.textures = null;
  }
  async parseTile(t, e, i, s, o) {
    const r = e.engineData, n = ke(s), a = this.fetchOptions, h = this.manager;
    let l = null;
    const c = r.transform, p = this._upRotationMatrix, f = (Be(t) || i).toLowerCase();
    switch (f) {
      case "b3dm": {
        const g = new Se(h);
        g.workingPath = n, g.fetchOptions = a, g.adjustmentTransform.copy(p), l = g.parse(t);
        break;
      }
      case "pnts": {
        const g = new Ee(h);
        g.workingPath = n, g.fetchOptions = a, l = g.parse(t);
        break;
      }
      case "i3dm": {
        const g = new Oe(h);
        g.workingPath = n, g.fetchOptions = a, g.adjustmentTransform.copy(p), g.ellipsoid.copy(this.ellipsoid), l = g.parse(t);
        break;
      }
      case "cmpt": {
        const g = new pi(h);
        g.workingPath = n, g.fetchOptions = a, g.adjustmentTransform.copy(p), g.ellipsoid.copy(this.ellipsoid), l = g.parse(t).then((S) => S.scene);
        break;
      }
      // 3DTILES_content_gltf
      case "gltf":
      case "glb": {
        const g = h.getHandler("path.gltf") || h.getHandler("path.glb") || new Kt(h);
        g.setWithCredentials(a.credentials === "include"), g.setRequestHeader(a.headers || {}), a.credentials === "include" && a.mode === "cors" && g.setCrossOrigin("use-credentials");
        let S = g.resourcePath || g.path || n;
        !/[\\/]$/.test(S) && S.length && (S += "/"), l = g.parseAsync(t, S).then((C) => {
          C.scene = C.scene || new Pt();
          const { scene: T } = C;
          return T.updateMatrix(), T.matrix.multiply(p).decompose(T.position, T.quaternion, T.scale), C;
        });
        break;
      }
      default: {
        l = this.invokeOnePlugin((g) => g.parseToMesh && g.parseToMesh(t, e, i, s, o));
        break;
      }
    }
    const u = await l;
    if (u === null)
      throw new Error(`TilesRenderer: Content type "${f}" not supported.`);
    let d, x;
    u.isObject3D ? (d = u, x = null) : (d = u.scene, x = u), d.updateMatrix(), d.matrix.premultiply(c), d.matrix.decompose(d.position, d.quaternion, d.scale), await this.invokeAllPlugins((g) => g.processTileModel && g.processTileModel(d, e)), d.traverse((g) => {
      g[Ve] = g.frustumCulled;
    }), pe(d, !this.autoDisableRendererCulling);
    const E = [], _ = [], F = [];
    if (d.traverse((g) => {
      if (g.geometry && _.push(g.geometry), g.material) {
        const S = g.material;
        E.push(g.material);
        for (const C in S) {
          const T = S[C];
          T && T.isTexture && F.push(T);
        }
      }
    }), o.aborted) {
      for (let g = 0, S = F.length; g < S; g++) {
        const C = F[g];
        C.image instanceof ImageBitmap && C.image.close(), C.dispose();
      }
      return;
    }
    r.materials = E, r.geometry = _, r.textures = F, r.scene = d, r.metadata = x;
  }
  disposeTile(t) {
    super.disposeTile(t);
    const e = t.engineData;
    if (e.scene) {
      const i = e.materials, s = e.geometry, o = e.textures, r = e.scene.parent;
      e.scene.traverse((n) => {
        n.userData.meshFeatures && n.userData.meshFeatures.dispose(), n.userData.structuralMetadata && n.userData.structuralMetadata.dispose();
      });
      for (let n = 0, a = s.length; n < a; n++)
        s[n].dispose();
      for (let n = 0, a = i.length; n < a; n++)
        i[n].dispose();
      for (let n = 0, a = o.length; n < a; n++) {
        const h = o[n];
        h.image instanceof ImageBitmap && h.image.close(), h.dispose();
      }
      r && r.remove(e.scene), e.scene = null, e.materials = null, e.textures = null, e.geometry = null, e.metadata = null;
    }
  }
  setTileVisible(t, e) {
    const i = t.engineData.scene, s = this.group;
    e ? i && (s.add(i), i.updateMatrixWorld(!0)) : i && s.remove(i), super.setTileVisible(t, e);
  }
  calculateBytesUsed(t, e) {
    const i = this._bytesUsed;
    return !i.has(t) && e && i.set(t, ai(e)), i.get(t) ?? null;
  }
  calculateTileViewError(t, e) {
    const i = t.engineData, s = this.cameras, o = this.cameraInfo, r = i.boundingVolume;
    let n = !1, a = 0, h = 1 / 0, l = 0, c = 1 / 0;
    for (let p = 0, f = s.length; p < f; p++) {
      const u = o[p];
      let d, x;
      if (u.isOrthographic) {
        const _ = u.pixelSize;
        d = t.geometricError / _, x = 1 / 0;
      } else {
        const _ = u.sseDenominator;
        x = r.distanceToPoint(u.position), d = x === 0 ? 1 / 0 : t.geometricError / (x * _);
      }
      const E = o[p].frustum;
      r.intersectsFrustum(E) && (n = !0, a = Math.max(a, d), h = Math.min(h, x)), l = Math.max(l, d), c = Math.min(c, x);
    }
    n ? (e.inView = !0, e.error = a, e.distanceFromCamera = h) : (e.inView = !1, e.error = l, e.distanceFromCamera = c);
  }
  // adjust the rotation of the group such that Y is altitude, X is North, and Z is East
  setLatLonToYUp(t, e) {
    console.warn("TilesRenderer: setLatLonToYUp is deprecated. Use the ReorientationPlugin, instead.");
    const { ellipsoid: i, group: s } = this;
    he.set(Math.PI / 2, Math.PI / 2, 0), le.makeRotationFromEuler(he), i.getEastNorthUpFrame(t, e, 0, s.matrix).multiply(le).invert().decompose(
      s.position,
      s.quaternion,
      s.scale
    ), s.updateMatrixWorld(!0);
  }
  dispose() {
    super.dispose(), this.group.removeFromParent();
  }
}
class Mi extends Je {
  constructor() {
    super(new ti(0, 0), new _i()), this.renderOrder = 1 / 0;
  }
  onBeforeRender(t) {
    const e = this.material.uniforms;
    t.getSize(e.resolution.value);
  }
  updateMatrixWorld() {
    this.matrixWorld.makeTranslation(this.position);
  }
  dispose() {
    this.geometry.dispose(), this.material.dispose();
  }
}
class _i extends ei {
  constructor() {
    super({
      depthWrite: !1,
      depthTest: !1,
      transparent: !0,
      uniforms: {
        resolution: { value: new A() },
        size: { value: 15 },
        thickness: { value: 2 },
        opacity: { value: 1 }
      },
      vertexShader: (
        /* glsl */
        `

				uniform float size;
				uniform float thickness;
				uniform vec2 resolution;
				varying vec2 vUv;

				void main() {

					vUv = uv;

					float aspect = resolution.x / resolution.y;
					vec2 offset = uv * 2.0 - vec2( 1.0 );
					offset.y *= aspect;

					vec4 screenPoint = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
					screenPoint.xy += offset * ( size + thickness ) * screenPoint.w / resolution.x;

					gl_Position = screenPoint;

				}
			`
      ),
      fragmentShader: (
        /* glsl */
        `

				uniform float size;
				uniform float thickness;
				uniform float opacity;

				varying vec2 vUv;
				void main() {

					float ht = 0.5 * thickness;
					float planeDim = size + thickness;
					float offset = ( planeDim - ht - 2.0 ) / planeDim;
					float texelThickness = ht / planeDim;

					vec2 vec = vUv * 2.0 - vec2( 1.0 );
					float dist = abs( length( vec ) - offset );
					float fw = fwidth( dist ) * 0.5;
					float a = smoothstep( texelThickness - fw, texelThickness + fw, dist );

					gl_FragColor = vec4( 1, 1, 1, opacity * ( 1.0 - a ) );

				}
			`
      )
    });
  }
}
const de = /* @__PURE__ */ new A(), ue = /* @__PURE__ */ new A();
class Pi {
  constructor() {
    this.domElement = null, this.buttons = 0, this.pointerType = null, this.pointerOrder = [], this.previousPositions = {}, this.pointerPositions = {}, this.startPositions = {}, this.pointerSetThisFrame = {}, this.hoverPosition = new A(), this.hoverSet = !1;
  }
  reset() {
    this.buttons = 0, this.pointerType = null, this.pointerOrder = [], this.previousPositions = {}, this.pointerPositions = {}, this.startPositions = {}, this.pointerSetThisFrame = {}, this.hoverPosition = new A(), this.hoverSet = !1;
  }
  // The pointers can be set multiple times per frame so track whether the pointer has
  // been set this frame or not so we don't overwrite the previous position and lose information
  // about pointer movement
  updateFrame() {
    const { previousPositions: t, pointerPositions: e } = this;
    for (const i in e)
      t[i].copy(e[i]);
  }
  setHoverEvent(t) {
    (t.pointerType === "mouse" || t.type === "wheel") && (this.getAdjustedPointer(t, this.hoverPosition), this.hoverSet = !0);
  }
  getLatestPoint(t) {
    return this.pointerType !== null ? (this.getCenterPoint(t), t) : this.hoverSet ? (t.copy(this.hoverPosition), t) : null;
  }
  // get the pointer position in the coordinate system of the target element
  getAdjustedPointer(t, e) {
    const s = (this.domElement ? this.domElement : t.target).getBoundingClientRect(), o = t.clientX - s.left, r = t.clientY - s.top;
    e.set(o, r);
  }
  addPointer(t) {
    const e = t.pointerId, i = new A();
    this.getAdjustedPointer(t, i), this.pointerOrder.push(e), this.pointerPositions[e] = i, this.previousPositions[e] = i.clone(), this.startPositions[e] = i.clone(), this.getPointerCount() === 1 && (this.pointerType = t.pointerType, this.buttons = t.buttons);
  }
  updatePointer(t) {
    const e = t.pointerId;
    return e in this.pointerPositions ? (this.getAdjustedPointer(t, this.pointerPositions[e]), !0) : !1;
  }
  deletePointer(t) {
    const e = t.pointerId, i = this.pointerOrder;
    i.splice(i.indexOf(e), 1), delete this.pointerPositions[e], delete this.previousPositions[e], delete this.startPositions[e], this.getPointerCount() === 0 && (this.buttons = 0, this.pointerType = null);
  }
  getPointerCount() {
    return this.pointerOrder.length;
  }
  getCenterPoint(t, e = this.pointerPositions) {
    const i = this.pointerOrder;
    if (this.getPointerCount() === 1 || this.getPointerType() === "mouse") {
      const s = i[0];
      return t.copy(e[s]), t;
    } else if (this.getPointerCount() === 2) {
      const s = this.pointerOrder[0], o = this.pointerOrder[1], r = e[s], n = e[o];
      return t.addVectors(r, n).multiplyScalar(0.5), t;
    }
    return null;
  }
  getPreviousCenterPoint(t) {
    return this.getCenterPoint(t, this.previousPositions);
  }
  getStartCenterPoint(t) {
    return this.getCenterPoint(t, this.startPositions);
  }
  getMoveDistance() {
    return this.getCenterPoint(de), this.getPreviousCenterPoint(ue), de.sub(ue).length();
  }
  getTouchPointerDistance(t = this.pointerPositions) {
    if (this.getPointerCount() <= 1 || this.getPointerType() === "mouse")
      return 0;
    const { pointerOrder: e } = this, i = e[0], s = e[1], o = t[i], r = t[s];
    return o.distanceTo(r);
  }
  getPreviousTouchPointerDistance() {
    return this.getTouchPointerDistance(this.previousPositions);
  }
  getStartTouchPointerDistance() {
    return this.getTouchPointerDistance(this.startPositions);
  }
  getPointerType() {
    return this.pointerType;
  }
  isPointerTouch() {
    return this.getPointerType() === "touch";
  }
  getPointerButtons() {
    return this.buttons;
  }
  isLeftClicked() {
    return !!(this.buttons & 1);
  }
  isRightClicked() {
    return !!(this.buttons & 2);
  }
}
const Ot = /* @__PURE__ */ new I();
function gt(m, t, e) {
  return e.makeTranslation(-m.x, -m.y, -m.z), Ot.makeRotationFromQuaternion(t), e.premultiply(Ot), Ot.makeTranslation(m.x, m.y, m.z), e.premultiply(Ot), e;
}
function ut(m, t, e) {
  e.x = m.x / t.clientWidth * 2 - 1, e.y = -(m.y / t.clientHeight) * 2 + 1, e.isVector3 && (e.z = 0);
}
function H(m, t, e) {
  const i = m instanceof Wt ? m : m.ray, { origin: s, direction: o } = i;
  s.set(t.x, t.y, -1).unproject(e), o.set(t.x, t.y, 1).unproject(e).sub(s), m.isRay || (m.near = 0, m.far = o.length(), m.camera = e), o.normalize();
}
const Z = 0, et = 1, X = 2, mt = 3, Zt = 4, qt = 0.05, Qt = 0.025, tt = /* @__PURE__ */ new I(), It = /* @__PURE__ */ new I(), W = /* @__PURE__ */ new y(), M = /* @__PURE__ */ new y(), Rt = /* @__PURE__ */ new y(), zt = /* @__PURE__ */ new y(), z = /* @__PURE__ */ new y(), B = /* @__PURE__ */ new y(), $t = /* @__PURE__ */ new y(), At = /* @__PURE__ */ new y(), G = /* @__PURE__ */ new it(), me = /* @__PURE__ */ new De(), O = /* @__PURE__ */ new y(), Ft = /* @__PURE__ */ new y(), Yt = /* @__PURE__ */ new y(), vi = /* @__PURE__ */ new it(), D = /* @__PURE__ */ new Wt(), Ut = /* @__PURE__ */ new A(), L = /* @__PURE__ */ new A(), fe = /* @__PURE__ */ new A(), _t = /* @__PURE__ */ new A(), Xt = /* @__PURE__ */ new A(), ge = /* @__PURE__ */ new A(), ye = { type: "change" }, xe = { type: "start" }, be = { type: "end" };
class Ti extends ft {
  get enabled() {
    return this._enabled;
  }
  set enabled(t) {
    t !== this.enabled && (this._enabled = t, this.resetState(), this.pointerTracker.reset(), this.enabled || (this.dragInertia.set(0, 0, 0), this.rotationInertia.set(0, 0)));
  }
  constructor(t = null, e = null, i = null, s = null) {
    super(), this.isEnvironmentControls = !0, this.domElement = null, this.camera = null, this.scene = null, this.tilesRenderer = null, this._enabled = !0, this.cameraRadius = 5, this.rotationSpeed = 1, this.minAltitude = 0, this.maxAltitude = 0.45 * Math.PI, this.minDistance = 10, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.zoomSpeed = 1, this.adjustHeight = !0, this.enableDamping = !1, this.dampingFactor = 0.15, this.fallbackPlane = new De(new y(0, 1, 0), 0), this.useFallbackPlane = !0, this.scaleZoomOrientationAtEdges = !1, this.autoAdjustCameraRotation = !0, this.state = Z, this.pointerTracker = new Pi(), this.needsUpdate = !1, this.actionHeightOffset = 0, this.pivotPoint = new y(), this.zoomDirectionSet = !1, this.zoomPointSet = !1, this.zoomDirection = new y(), this.zoomPoint = new y(), this.zoomDelta = 0, this.rotationInertiaPivot = new y(), this.rotationInertia = new A(), this.dragInertia = new y(), this.inertiaTargetDistance = 1 / 0, this.inertiaStableFrames = 0, this.pivotMesh = new Mi(), this.pivotMesh.raycast = () => {
    }, this.pivotMesh.scale.setScalar(0.25), this.raycaster = new ii(), this.raycaster.firstHitOnly = !0, this.up = new y(0, 1, 0), this.clock = new we(), this._detachCallback = null, this._upInitialized = !1, this._lastUsedState = Z, this._zoomPointWasSet = !1, this._tilesOnChangeCallback = () => this.zoomPointSet = !1, i && this.attach(i), e && this.setCamera(e), t && this.setScene(t), s && this.setTilesRenderer(s);
  }
  setScene(t) {
    this.scene = t;
  }
  setCamera(t) {
    this.camera = t, this._upInitialized = !1, this.zoomDirectionSet = !1, this.zoomPointSet = !1, this.needsUpdate = !0, this.raycaster.camera = t, this.resetState();
  }
  setTilesRenderer(t) {
    console.warn('EnvironmentControls: "setTilesRenderer" has been deprecated. Use "setScene" and "setEllipsoid", instead.'), this.tilesRenderer = t, this.tilesRenderer !== null && this.setScene(this.tilesRenderer.group);
  }
  attach(t) {
    if (this.domElement)
      throw new Error("EnvironmentControls: Controls already attached to element");
    this.domElement = t, this.pointerTracker.domElement = t, t.style.touchAction = "none";
    const e = (l) => {
      this.enabled && l.preventDefault();
    }, i = (l) => {
      if (!this.enabled)
        return;
      l.preventDefault();
      const {
        camera: c,
        raycaster: p,
        domElement: f,
        up: u,
        pivotMesh: d,
        pointerTracker: x,
        scene: E,
        pivotPoint: _,
        enabled: F
      } = this;
      if (x.addPointer(l), this.needsUpdate = !0, x.isPointerTouch()) {
        if (d.visible = !1, x.getPointerCount() === 0)
          f.setPointerCapture(l.pointerId);
        else if (x.getPointerCount() > 2) {
          this.resetState();
          return;
        }
      }
      x.getCenterPoint(L), ut(L, f, L), H(p, L, c);
      const g = Math.abs(p.ray.direction.dot(u));
      if (g < qt || g < Qt)
        return;
      const S = this._raycast(p);
      S && (x.getPointerCount() === 2 || x.isRightClicked() || x.isLeftClicked() && l.shiftKey ? (this.setState(x.isPointerTouch() ? Zt : X), _.copy(S.point), d.position.copy(S.point), d.visible = x.isPointerTouch() ? !1 : F, d.updateMatrixWorld(), E.add(d)) : x.isLeftClicked() && (this.setState(et), _.copy(S.point), d.position.copy(S.point), d.updateMatrixWorld(), E.add(d)));
    };
    let s = !1;
    const o = (l) => {
      const { pointerTracker: c } = this;
      if (!this.enabled)
        return;
      l.preventDefault();
      const {
        pivotMesh: p,
        enabled: f
      } = this;
      this.zoomDirectionSet = !1, this.zoomPointSet = !1, this.state !== Z && (this.needsUpdate = !0), c.setHoverEvent(l), c.updatePointer(l) && (c.isPointerTouch() && c.getPointerCount() === 2 && (s || (s = !0, queueMicrotask(() => {
        s = !1, c.getCenterPoint(Xt);
        const u = c.getStartTouchPointerDistance(), d = c.getTouchPointerDistance(), x = d - u;
        if (this.state === Z || this.state === Zt) {
          c.getCenterPoint(Xt), c.getStartCenterPoint(ge);
          const E = 2 * window.devicePixelRatio, _ = Xt.distanceTo(ge);
          (Math.abs(x) > E || _ > E) && (Math.abs(x) > _ ? (this.setState(mt), this.zoomDirectionSet = !1) : this.setState(X));
        }
        if (this.state === mt) {
          const E = c.getPreviousTouchPointerDistance();
          this.zoomDelta += d - E, p.visible = !1;
        } else this.state === X && (p.visible = f);
      }))), this.dispatchEvent(ye));
    }, r = (l) => {
      const { pointerTracker: c } = this;
      !this.enabled || c.getPointerCount() === 0 || (c.deletePointer(l), c.getPointerType() === "touch" && c.getPointerCount() === 0 && t.releasePointerCapture(l.pointerId), this.resetState(), this.needsUpdate = !0);
    }, n = (l) => {
      if (!this.enabled)
        return;
      l.preventDefault();
      const { pointerTracker: c } = this;
      c.setHoverEvent(l), c.updatePointer(l), this.dispatchEvent(xe);
      let p;
      switch (l.deltaMode) {
        case 2:
          p = l.deltaY * 800;
          break;
        case 1:
          p = l.deltaY * 40;
          break;
        case 0:
          p = l.deltaY;
          break;
      }
      const f = Math.sign(p), u = Math.abs(p);
      this.zoomDelta -= 0.25 * f * u, this.needsUpdate = !0, this._lastUsedState = mt, this.dispatchEvent(be);
    }, a = (l) => {
      this.enabled && this.resetState();
    };
    t.addEventListener("contextmenu", e), t.addEventListener("pointerdown", i), t.addEventListener("wheel", n, { passive: !1 });
    const h = t.getRootNode();
    h.addEventListener("pointermove", o), h.addEventListener("pointerup", r), h.addEventListener("pointerleave", a), this._detachCallback = () => {
      t.removeEventListener("contextmenu", e), t.removeEventListener("pointerdown", i), t.removeEventListener("wheel", n), h.removeEventListener("pointermove", o), h.removeEventListener("pointerup", r), h.removeEventListener("pointerleave", a);
    };
  }
  detach() {
    this.domElement = null, this._detachCallback && (this._detachCallback(), this._detachCallback = null, this.pointerTracker.reset());
  }
  // override-able functions for retrieving the up direction at a point
  getUpDirection(t, e) {
    e.copy(this.up);
  }
  getCameraUpDirection(t) {
    this.getUpDirection(this.camera.position, t);
  }
  // returns the active / last used pivot point for the scene
  getPivotPoint(t) {
    let e = null;
    this._lastUsedState === mt ? this._zoomPointWasSet && (e = t.copy(this.zoomPoint)) : (this._lastUsedState === X || this._lastUsedState === et) && (e = t.copy(this.pivotPoint));
    const { camera: i, raycaster: s } = this;
    e !== null && (M.copy(e).project(i), (M.x < -1 || M.x > 1 || M.y < -1 || M.y > 1) && (e = null)), H(s, { x: 0, y: 0 }, i);
    const o = this._raycast(s);
    return o && (e === null || o.distance < e.distanceTo(s.ray.origin)) && (e = t.copy(o.point)), e;
  }
  resetState() {
    this.state !== Z && this.dispatchEvent(be), this.state = Z, this.pivotMesh.removeFromParent(), this.pivotMesh.visible = this.enabled, this.actionHeightOffset = 0, this.pointerTracker.reset();
  }
  setState(t = this.state, e = !0) {
    this.state !== t && (this.state === Z && e && this.dispatchEvent(xe), this.pivotMesh.visible = this.enabled, this.dragInertia.set(0, 0, 0), this.rotationInertia.set(0, 0), this.inertiaStableFrames = 0, this.state = t, t !== Z && t !== Zt && (this._lastUsedState = t));
  }
  update(t = Math.min(this.clock.getDelta(), 64 / 1e3)) {
    if (!this.enabled || !this.camera || t === 0)
      return;
    const {
      camera: e,
      cameraRadius: i,
      pivotPoint: s,
      up: o,
      state: r,
      adjustHeight: n,
      autoAdjustCameraRotation: a
    } = this;
    e.updateMatrixWorld(), this.getCameraUpDirection(O), this._upInitialized || (this._upInitialized = !0, this.up.copy(O)), this.zoomPointSet = !1;
    const h = this._inertiaNeedsUpdate(), l = this.needsUpdate || h;
    if (this.needsUpdate || h) {
      const p = this.zoomDelta;
      this._updateZoom(), this._updatePosition(t), this._updateRotation(t), r === et || r === X ? (z.set(0, 0, -1).transformDirection(e.matrixWorld), this.inertiaTargetDistance = M.copy(s).sub(e.position).dot(z)) : r === Z && this._updateInertia(t), (r !== Z || p !== 0 || h) && this.dispatchEvent(ye), this.needsUpdate = !1;
    }
    const c = e.isOrthographicCamera ? null : n && this._getPointBelowCamera() || null;
    if (this.getCameraUpDirection(O), this._setFrame(O), (this.state === et || this.state === X) && this.actionHeightOffset !== 0) {
      const { actionHeightOffset: p } = this;
      e.position.addScaledVector(o, -p), s.addScaledVector(o, -p), c && (c.distance -= p);
    }
    if (this.actionHeightOffset = 0, c) {
      const p = c.distance;
      if (p < i) {
        const f = i - p;
        e.position.addScaledVector(o, f), s.addScaledVector(o, f), this.actionHeightOffset = f;
      }
    }
    this.pointerTracker.updateFrame(), l && a && (this.getCameraUpDirection(O), this._alignCameraUp(O, 1), this.getCameraUpDirection(O), this._clampRotation(O));
  }
  // updates the camera to position it based on the constraints of the controls
  adjustCamera(t) {
    const { adjustHeight: e, cameraRadius: i } = this;
    if (t.isPerspectiveCamera) {
      this.getUpDirection(t.position, O);
      const s = e && this._getPointBelowCamera(t.position, O) || null;
      if (s) {
        const o = s.distance;
        o < i && t.position.addScaledVector(O, i - o);
      }
    }
  }
  dispose() {
    this.detach();
  }
  // private
  _updateInertia(t) {
    const {
      rotationInertia: e,
      pivotPoint: i,
      dragInertia: s,
      enableDamping: o,
      dampingFactor: r,
      camera: n,
      cameraRadius: a,
      minDistance: h,
      inertiaTargetDistance: l
    } = this;
    if (!this.enableDamping || this.inertiaStableFrames > 1) {
      s.set(0, 0, 0), e.set(0, 0, 0);
      return;
    }
    const c = Math.pow(2, -t / r), p = Math.max(n.near, a, h, l), d = 0.25 * (2 / (2 * 1e3));
    if (e.lengthSq() > 0) {
      H(D, M.set(0, 0, -1), n), D.applyMatrix4(n.matrixWorldInverse), D.direction.normalize(), D.recast(-D.direction.dot(D.origin)).at(p / D.direction.z, M), M.applyMatrix4(n.matrixWorld), H(D, W.set(d, d, -1), n), D.applyMatrix4(n.matrixWorldInverse), D.direction.normalize(), D.recast(-D.direction.dot(D.origin)).at(p / D.direction.z, W), W.applyMatrix4(n.matrixWorld), M.sub(i).normalize(), W.sub(i).normalize();
      const x = M.angleTo(W) / t;
      e.multiplyScalar(c), (e.lengthSq() < x ** 2 || !o) && e.set(0, 0);
    }
    if (s.lengthSq() > 0) {
      H(D, M.set(0, 0, -1), n), D.applyMatrix4(n.matrixWorldInverse), D.direction.normalize(), D.recast(-D.direction.dot(D.origin)).at(p / D.direction.z, M), M.applyMatrix4(n.matrixWorld), H(D, W.set(d, d, -1), n), D.applyMatrix4(n.matrixWorldInverse), D.direction.normalize(), D.recast(-D.direction.dot(D.origin)).at(p / D.direction.z, W), W.applyMatrix4(n.matrixWorld);
      const x = M.distanceTo(W) / t;
      s.multiplyScalar(c), (s.lengthSq() < x ** 2 || !o) && s.set(0, 0, 0);
    }
    e.lengthSq() > 0 && this._applyRotation(e.x * t, e.y * t, i), s.lengthSq() > 0 && (n.position.addScaledVector(s, t), n.updateMatrixWorld());
  }
  _inertiaNeedsUpdate() {
    const { rotationInertia: t, dragInertia: e } = this;
    return t.lengthSq() !== 0 || e.lengthSq() !== 0;
  }
  _updateZoom() {
    const {
      zoomPoint: t,
      zoomDirection: e,
      camera: i,
      minDistance: s,
      maxDistance: o,
      pointerTracker: r,
      domElement: n,
      minZoom: a,
      maxZoom: h,
      zoomSpeed: l,
      state: c
    } = this;
    let p = this.zoomDelta;
    if (this.zoomDelta = 0, !(!r.getLatestPoint(L) || p === 0 && c !== mt))
      if (this.rotationInertia.set(0, 0), this.dragInertia.set(0, 0, 0), i.isOrthographicCamera) {
        this._updateZoomDirection();
        const f = this.zoomPointSet || this._updateZoomPoint();
        Ft.unproject(i);
        const u = Math.pow(0.95, Math.abs(p * 0.05));
        let d = p > 0 ? 1 / Math.abs(u) : u;
        d *= l, d > 1 ? h < i.zoom * d && (d = 1) : a > i.zoom * d && (d = 1), i.zoom *= d, i.updateProjectionMatrix(), f && (ut(L, n, Yt), Yt.unproject(i), i.position.sub(Yt).add(Ft), i.updateMatrixWorld());
      } else {
        this._updateZoomDirection();
        const f = M.copy(e);
        if (this.zoomPointSet || this._updateZoomPoint()) {
          const u = t.distanceTo(i.position);
          if (p < 0) {
            const d = Math.min(0, u - o);
            p = p * u * l * 25e-4, p = Math.max(p, d);
          } else {
            const d = Math.max(0, u - s);
            p = p * Math.max(u - s, 0) * l * 25e-4, p = Math.min(p, d);
          }
          i.position.addScaledVector(e, p), i.updateMatrixWorld();
        } else {
          const u = this._getPointBelowCamera();
          if (u) {
            const d = u.distance;
            f.set(0, 0, -1).transformDirection(i.matrixWorld), i.position.addScaledVector(f, p * d * 0.01), i.updateMatrixWorld();
          }
        }
      }
  }
  _updateZoomDirection() {
    if (this.zoomDirectionSet)
      return;
    const { domElement: t, raycaster: e, camera: i, zoomDirection: s, pointerTracker: o } = this;
    o.getLatestPoint(L), ut(L, t, Ft), H(e, Ft, i), s.copy(e.ray.direction).normalize(), this.zoomDirectionSet = !0;
  }
  // update the point being zoomed in to based on the zoom direction
  _updateZoomPoint() {
    const {
      camera: t,
      zoomDirectionSet: e,
      zoomDirection: i,
      raycaster: s,
      zoomPoint: o,
      pointerTracker: r,
      domElement: n
    } = this;
    if (this._zoomPointWasSet = !1, !e)
      return !1;
    t.isOrthographicCamera && r.getLatestPoint(Ut) ? (ut(Ut, n, Ut), H(s, Ut, t)) : (s.ray.origin.copy(t.position), s.ray.direction.copy(i), s.near = 0, s.far = 1 / 0);
    const a = this._raycast(s);
    return a ? (o.copy(a.point), this.zoomPointSet = !0, this._zoomPointWasSet = !0, !0) : !1;
  }
  // returns the point below the camera
  _getPointBelowCamera(t = this.camera.position, e = this.up) {
    const { raycaster: i } = this;
    i.ray.direction.copy(e).multiplyScalar(-1), i.ray.origin.copy(t).addScaledVector(e, 1e5), i.near = 0, i.far = 1 / 0;
    const s = this._raycast(i);
    return s && (s.distance -= 1e5), s;
  }
  // update the drag action
  _updatePosition(t) {
    const {
      raycaster: e,
      camera: i,
      pivotPoint: s,
      up: o,
      pointerTracker: r,
      domElement: n,
      state: a,
      dragInertia: h
    } = this;
    if (a === et) {
      if (r.getCenterPoint(L), ut(L, n, L), me.setFromNormalAndCoplanarPoint(o, s), H(e, L, i), Math.abs(e.ray.direction.dot(o)) < qt) {
        const l = Math.acos(qt);
        At.crossVectors(e.ray.direction, o).normalize(), e.ray.direction.copy(o).applyAxisAngle(At, l).multiplyScalar(-1);
      }
      if (this.getUpDirection(s, O), Math.abs(e.ray.direction.dot(O)) < Qt) {
        const l = Math.acos(Qt);
        At.crossVectors(e.ray.direction, O).normalize(), e.ray.direction.copy(O).applyAxisAngle(At, l).multiplyScalar(-1);
      }
      e.ray.intersectPlane(me, M) && (W.subVectors(s, M), i.position.add(W), i.updateMatrixWorld(), W.multiplyScalar(1 / t), r.getMoveDistance() / t < 2 * window.devicePixelRatio ? this.inertiaStableFrames++ : (h.copy(W), this.inertiaStableFrames = 0));
    }
  }
  _updateRotation(t) {
    const {
      pivotPoint: e,
      pointerTracker: i,
      domElement: s,
      state: o,
      rotationInertia: r
    } = this;
    o === X && (i.getCenterPoint(L), i.getPreviousCenterPoint(fe), _t.subVectors(L, fe).multiplyScalar(2 * Math.PI / s.clientHeight), this._applyRotation(_t.x, _t.y, e), _t.multiplyScalar(1 / t), i.getMoveDistance() / t < 2 * window.devicePixelRatio ? this.inertiaStableFrames++ : (r.copy(_t), this.inertiaStableFrames = 0));
  }
  _applyRotation(t, e, i) {
    if (t === 0 && e === 0)
      return;
    const {
      camera: s,
      minAltitude: o,
      maxAltitude: r,
      rotationSpeed: n
    } = this, a = -t * n;
    let h = e * n;
    z.set(0, 0, 1).transformDirection(s.matrixWorld), B.set(1, 0, 0).transformDirection(s.matrixWorld), this.getUpDirection(i, O);
    let l;
    O.dot(z) > 1 - 1e-10 ? l = 0 : (M.crossVectors(O, z).normalize(), l = Math.sign(M.dot(B)) * O.angleTo(z)), h > 0 ? (h = Math.min(l - o, h), h = Math.max(0, h)) : (h = Math.max(l - r, h), h = Math.min(0, h)), G.setFromAxisAngle(O, a), gt(i, G, tt), s.matrixWorld.premultiply(tt), B.set(1, 0, 0).transformDirection(s.matrixWorld), G.setFromAxisAngle(B, -h), gt(i, G, tt), s.matrixWorld.premultiply(tt), s.matrixWorld.decompose(s.position, s.quaternion, M);
  }
  // sets the "up" axis for the current surface of the tileset
  _setFrame(t) {
    const {
      up: e,
      camera: i,
      zoomPoint: s,
      zoomDirectionSet: o,
      zoomPointSet: r,
      scaleZoomOrientationAtEdges: n
    } = this;
    if (o && (r || this._updateZoomPoint())) {
      if (G.setFromUnitVectors(e, t), n) {
        this.getUpDirection(s, M);
        let a = Math.max(M.dot(e) - 0.6, 0) / 0.4;
        a = v.mapLinear(a, 0, 0.5, 0, 1), a = Math.min(a, 1), i.isOrthographicCamera && (a *= 0.1), G.slerp(vi, 1 - a);
      }
      gt(s, G, tt), i.updateMatrixWorld(), i.matrixWorld.premultiply(tt), i.matrixWorld.decompose(i.position, i.quaternion, M), this.zoomDirectionSet = !1, this._updateZoomDirection();
    }
    e.copy(t), i.updateMatrixWorld();
  }
  _raycast(t) {
    const { scene: e, useFallbackPlane: i, fallbackPlane: s } = this, o = t.intersectObject(e)[0] || null;
    if (o)
      return o;
    if (i) {
      const r = s;
      if (t.ray.intersectPlane(r, M))
        return {
          point: M.clone(),
          distance: t.ray.origin.distanceTo(M)
        };
    }
    return null;
  }
  // tilt the camera to align with the provided "up" value
  _alignCameraUp(t, e = 1) {
    const { camera: i, state: s, pivotPoint: o, zoomPoint: r, zoomPointSet: n } = this;
    i.updateMatrixWorld(), z.set(0, 0, -1).transformDirection(i.matrixWorld), B.set(-1, 0, 0).transformDirection(i.matrixWorld);
    let a = v.mapLinear(1 - Math.abs(z.dot(t)), 0, 0.2, 0, 1);
    a = v.clamp(a, 0, 1), e *= a, $t.crossVectors(t, z), $t.lerp(B, 1 - e).normalize(), G.setFromUnitVectors(B, $t), i.quaternion.premultiply(G);
    let h = null;
    s === et || s === X ? h = Rt.copy(o) : n && (h = Rt.copy(r)), h && (It.copy(i.matrixWorld).invert(), M.copy(h).applyMatrix4(It), i.updateMatrixWorld(), M.applyMatrix4(i.matrixWorld), zt.subVectors(h, M), i.position.add(zt)), i.updateMatrixWorld();
  }
  // clamp rotation to the given "up" vector
  _clampRotation(t) {
    const { camera: e, minAltitude: i, maxAltitude: s, state: o, pivotPoint: r, zoomPoint: n, zoomPointSet: a } = this;
    e.updateMatrixWorld(), z.set(0, 0, 1).transformDirection(e.matrixWorld), B.set(1, 0, 0).transformDirection(e.matrixWorld);
    let h;
    t.dot(z) > 1 - 1e-10 ? h = 0 : (M.crossVectors(t, z), h = Math.sign(M.dot(B)) * t.angleTo(z));
    let l;
    if (h > s)
      l = s;
    else if (h < i)
      l = i;
    else
      return;
    z.copy(t), G.setFromAxisAngle(B, l), z.applyQuaternion(G).normalize(), M.crossVectors(z, B).normalize(), tt.makeBasis(B, M, z), e.quaternion.setFromRotationMatrix(tt);
    let c = null;
    o === et || o === X ? c = Rt.copy(r) : a && (c = Rt.copy(n)), c && (It.copy(e.matrixWorld).invert(), M.copy(c).applyMatrix4(It), e.updateMatrixWorld(), M.applyMatrix4(e.matrixWorld), zt.subVectors(c, M), e.position.add(zt)), e.updateMatrixWorld();
  }
}
const Me = /* @__PURE__ */ new I(), pt = /* @__PURE__ */ new I(), N = /* @__PURE__ */ new y(), P = /* @__PURE__ */ new y(), K = /* @__PURE__ */ new y(), k = /* @__PURE__ */ new y(), Di = /* @__PURE__ */ new y(), dt = /* @__PURE__ */ new y(), J = /* @__PURE__ */ new it(), _e = /* @__PURE__ */ new y(), ot = /* @__PURE__ */ new y(), w = /* @__PURE__ */ new Wt(), Pe = /* @__PURE__ */ new ci(), Vt = /* @__PURE__ */ new A(), ve = {}, wi = 2550;
class Li extends Ti {
  get tilesGroup() {
    return console.warn('GlobeControls: "tilesGroup" has been deprecated. Use "ellipsoidGroup", instead.'), this.ellipsoidFrame;
  }
  get ellipsoidFrame() {
    return this.ellipsoidGroup.matrixWorld;
  }
  get ellipsoidFrameInverse() {
    const { ellipsoidGroup: t, ellipsoidFrame: e, _ellipsoidFrameInverse: i } = this;
    return t.matrixWorldInverse ? t.matrixWorldInverse : i.copy(e).invert();
  }
  constructor(t = null, e = null, i = null, s = null) {
    super(t, e, i), this.isGlobeControls = !0, this._dragMode = 0, this._rotationMode = 0, this.maxZoom = 0.01, this.nearMargin = 0.25, this.farMargin = 0, this.useFallbackPlane = !1, this.autoAdjustCameraRotation = !1, this.globeInertia = new it(), this.globeInertiaFactor = 0, this.ellipsoid = vt.clone(), this.ellipsoidGroup = new Pt(), this._ellipsoidFrameInverse = new I(), s !== null && this.setTilesRenderer(s);
  }
  setTilesRenderer(t) {
    super.setTilesRenderer(t), t !== null && this.setEllipsoid(t.ellipsoid, t.group);
  }
  setEllipsoid(t, e) {
    this.ellipsoid = t || vt.clone(), this.ellipsoidGroup = e || new Pt();
  }
  getPivotPoint(t) {
    const { camera: e, ellipsoidFrame: i, ellipsoidFrameInverse: s, ellipsoid: o } = this;
    return k.set(0, 0, -1).transformDirection(e.matrixWorld), w.origin.copy(e.position), w.direction.copy(k), w.applyMatrix4(s), o.closestPointToRayEstimate(w, P).applyMatrix4(i), (super.getPivotPoint(t) === null || N.subVectors(t, w.origin).dot(w.direction) > N.subVectors(P, w.origin).dot(w.direction)) && t.copy(P), t;
  }
  // get the vector to the center of the provided globe
  getVectorToCenter(t) {
    const { ellipsoidFrame: e, camera: i } = this;
    return t.setFromMatrixPosition(e).sub(i.position);
  }
  // get the distance to the center of the globe
  getDistanceToCenter() {
    return this.getVectorToCenter(P).length();
  }
  getUpDirection(t, e) {
    const { ellipsoidFrame: i, ellipsoidFrameInverse: s, ellipsoid: o } = this;
    P.copy(t).applyMatrix4(s), o.getPositionToNormal(P, e), e.transformDirection(i);
  }
  getCameraUpDirection(t) {
    const { ellipsoidFrame: e, ellipsoidFrameInverse: i, ellipsoid: s, camera: o } = this;
    o.isOrthographicCamera ? (this._getVirtualOrthoCameraPosition(P), P.applyMatrix4(i), s.getPositionToNormal(P, t), t.transformDirection(e)) : this.getUpDirection(o.position, t);
  }
  update(t = Math.min(this.clock.getDelta(), 64 / 1e3)) {
    if (!this.enabled || !this.camera || t === 0)
      return;
    const { camera: e, pivotMesh: i } = this;
    this._isNearControls() ? this.scaleZoomOrientationAtEdges = this.zoomDelta < 0 : (this.state !== Z && this._dragMode !== 1 && this._rotationMode !== 1 && (i.visible = !1), this.scaleZoomOrientationAtEdges = !1);
    const s = this.needsUpdate || this._inertiaNeedsUpdate();
    super.update(t), this.adjustCamera(e), s && this._isNearControls() && (this.getCameraUpDirection(dt), this._alignCameraUp(dt, 1), this.getCameraUpDirection(dt), this._clampRotation(dt));
  }
  // Updates the passed camera near and far clip planes to encapsulate the ellipsoid from the
  // current position in addition to adjusting the height.
  adjustCamera(t) {
    super.adjustCamera(t);
    const { ellipsoidFrame: e, ellipsoidFrameInverse: i, ellipsoid: s, nearMargin: o, farMargin: r } = this, n = Math.max(...s.radius);
    if (t.isPerspectiveCamera) {
      const a = P.setFromMatrixPosition(e).sub(t.position).length(), h = o * n, l = v.clamp((a - n) / h, 0, 1), c = v.lerp(1, 1e3, l);
      t.near = Math.max(c, a - n - h), N.copy(t.position).applyMatrix4(i), s.getPositionToCartographic(N, ve);
      const p = Math.max(s.getPositionElevation(N), wi), f = s.calculateHorizonDistance(ve.lat, p);
      t.far = f + 0.1 + n * r, t.updateProjectionMatrix();
    } else {
      this._getVirtualOrthoCameraPosition(t.position, t), t.updateMatrixWorld(), Me.copy(t.matrixWorld).invert(), P.setFromMatrixPosition(e).applyMatrix4(Me);
      const a = -P.z;
      t.near = a - n * (1 + o), t.far = a + 0.1 + n * r, t.position.addScaledVector(k, t.near), t.far -= t.near, t.near = 0, t.updateProjectionMatrix(), t.updateMatrixWorld();
    }
  }
  // resets the "stuck" drag modes
  setState(...t) {
    super.setState(...t), this._dragMode = 0, this._rotationMode = 0;
  }
  _updateInertia(t) {
    super._updateInertia(t);
    const {
      globeInertia: e,
      enableDamping: i,
      dampingFactor: s,
      camera: o,
      cameraRadius: r,
      minDistance: n,
      inertiaTargetDistance: a,
      ellipsoidFrame: h
    } = this;
    if (!this.enableDamping || this.inertiaStableFrames > 1) {
      this.globeInertiaFactor = 0, this.globeInertia.identity();
      return;
    }
    const l = Math.pow(2, -t / s), c = Math.max(o.near, r, n, a), u = 0.25 * (2 / (2 * 1e3));
    if (K.setFromMatrixPosition(h), this.globeInertiaFactor !== 0) {
      H(w, P.set(0, 0, -1), o), w.applyMatrix4(o.matrixWorldInverse), w.direction.normalize(), w.recast(-w.direction.dot(w.origin)).at(c / w.direction.z, P), P.applyMatrix4(o.matrixWorld), H(w, N.set(u, u, -1), o), w.applyMatrix4(o.matrixWorldInverse), w.direction.normalize(), w.recast(-w.direction.dot(w.origin)).at(c / w.direction.z, N), N.applyMatrix4(o.matrixWorld), P.sub(K).normalize(), N.sub(K).normalize(), this.globeInertiaFactor *= l;
      const d = P.angleTo(N) / t;
      (2 * Math.acos(e.w) * this.globeInertiaFactor < d || !i) && (this.globeInertiaFactor = 0, e.identity());
    }
    this.globeInertiaFactor !== 0 && (e.w === 1 && (e.x !== 0 || e.y !== 0 || e.z !== 0) && (e.w = Math.min(e.w, 1 - 1e-9)), K.setFromMatrixPosition(h), J.identity().slerp(e, this.globeInertiaFactor * t), gt(K, J, pt), o.matrixWorld.premultiply(pt), o.matrixWorld.decompose(o.position, o.quaternion, P));
  }
  _inertiaNeedsUpdate() {
    return super._inertiaNeedsUpdate() || this.globeInertiaFactor !== 0;
  }
  _updatePosition(t) {
    if (this.state === et) {
      this._dragMode === 0 && (this._dragMode = this._isNearControls() ? 1 : -1);
      const {
        raycaster: e,
        camera: i,
        pivotPoint: s,
        pointerTracker: o,
        domElement: r,
        ellipsoidFrame: n,
        ellipsoidFrameInverse: a
      } = this, h = N, l = Di;
      o.getCenterPoint(Vt), ut(Vt, r, Vt), H(e, Vt, i), e.ray.applyMatrix4(a);
      const c = P.copy(s).applyMatrix4(a).length();
      if (Pe.radius.setScalar(c), !Pe.intersectRay(e.ray, P)) {
        this.resetState(), this._updateInertia(t);
        return;
      }
      P.applyMatrix4(n), K.setFromMatrixPosition(n), h.subVectors(s, K).normalize(), l.subVectors(P, K).normalize(), J.setFromUnitVectors(l, h), gt(K, J, pt), i.matrixWorld.premultiply(pt), i.matrixWorld.decompose(i.position, i.quaternion, P), o.getMoveDistance() / t < 2 * window.devicePixelRatio ? this.inertiaStableFrames++ : (this.globeInertia.copy(J), this.globeInertiaFactor = 1 / t, this.inertiaStableFrames = 0);
    }
  }
  // disable rotation once we're outside the control transition
  _updateRotation(...t) {
    this._rotationMode === 1 || this._isNearControls() ? (this._rotationMode = 1, super._updateRotation(...t)) : (this.pivotMesh.visible = !1, this._rotationMode = -1);
  }
  _updateZoom() {
    const { zoomDelta: t, ellipsoid: e, zoomSpeed: i, zoomPoint: s, camera: o, maxZoom: r, state: n } = this;
    if (n !== mt && t === 0)
      return;
    this.rotationInertia.set(0, 0), this.dragInertia.set(0, 0, 0), this.globeInertia.identity(), this.globeInertiaFactor = 0;
    const a = v.clamp(v.mapLinear(Math.abs(t), 0, 20, 0, 1), 0, 1);
    if (this._isNearControls() || t > 0) {
      if (this._updateZoomDirection(), t < 0 && (this.zoomPointSet || this._updateZoomPoint())) {
        k.set(0, 0, -1).transformDirection(o.matrixWorld).normalize(), ot.copy(this.up).multiplyScalar(-1), this.getUpDirection(s, _e);
        const h = v.clamp(v.mapLinear(-_e.dot(ot), 1, 0.95, 0, 1), 0, 1), l = 1 - k.dot(ot), c = o.isOrthographicCamera ? 0.05 : 1, p = v.clamp(a * 3, 0, 1), f = Math.min(h * l * c * p, 0.1);
        ot.lerpVectors(k, ot, f).normalize(), J.setFromUnitVectors(k, ot), gt(s, J, pt), o.matrixWorld.premultiply(pt), o.matrixWorld.decompose(o.position, o.quaternion, ot), this.zoomDirection.subVectors(s, o.position).normalize();
      }
      super._updateZoom();
    } else if (o.isPerspectiveCamera) {
      const h = this._getPerspectiveTransitionDistance(), l = this._getMaxPerspectiveDistance(), c = v.mapLinear(this.getDistanceToCenter(), h, l, 0, 1);
      this._tiltTowardsCenter(v.lerp(0, 0.4, c * a)), this._alignCameraUpToNorth(v.lerp(0, 0.2, c * a));
      const p = this.getDistanceToCenter() - e.radius.x, f = t * p * i * 25e-4, u = Math.max(f, Math.min(this.getDistanceToCenter() - l, 0));
      this.getVectorToCenter(P).normalize(), this.camera.position.addScaledVector(P, u), this.camera.updateMatrixWorld(), this.zoomDelta = 0;
    } else {
      const h = this._getOrthographicTransitionZoom(), l = this._getMinOrthographicZoom(), c = v.mapLinear(o.zoom, h, l, 0, 1);
      this._tiltTowardsCenter(v.lerp(0, 0.4, c * a)), this._alignCameraUpToNorth(v.lerp(0, 0.2, c * a));
      const p = this.zoomDelta, f = Math.pow(0.95, Math.abs(p * 0.05)), u = p > 0 ? 1 / Math.abs(f) : f, d = l / o.zoom, x = Math.max(u * i, Math.min(d, 1));
      o.zoom = Math.min(r, o.zoom * x), o.updateProjectionMatrix(), this.zoomDelta = 0, this.zoomDirectionSet = !1;
    }
  }
  // tilt the camera to align with north
  _alignCameraUpToNorth(t) {
    const { ellipsoidFrame: e } = this;
    dt.set(0, 0, 1).transformDirection(e), this._alignCameraUp(dt, t);
  }
  // tilt the camera to look at the center of the globe
  _tiltTowardsCenter(t) {
    const {
      camera: e,
      ellipsoidFrame: i
    } = this;
    k.set(0, 0, -1).transformDirection(e.matrixWorld).normalize(), P.setFromMatrixPosition(i).sub(e.position).normalize(), P.lerp(k, 1 - t).normalize(), J.setFromUnitVectors(k, P), e.quaternion.premultiply(J), e.updateMatrixWorld();
  }
  // returns the perspective camera transition distance can move to based on globe size and fov
  _getPerspectiveTransitionDistance() {
    const { camera: t, ellipsoid: e } = this;
    if (!t.isPerspectiveCamera)
      throw new Error();
    const i = Math.max(...e.radius), s = 2 * Math.atan(Math.tan(v.DEG2RAD * t.fov * 0.5) * t.aspect), o = i / Math.tan(v.DEG2RAD * t.fov * 0.5), r = i / Math.tan(s * 0.5);
    return Math.max(o, r);
  }
  // returns the max distance the perspective camera can move to based on globe size and fov
  _getMaxPerspectiveDistance() {
    const { camera: t, ellipsoid: e } = this;
    if (!t.isPerspectiveCamera)
      throw new Error();
    const i = Math.max(...e.radius), s = 2 * Math.atan(Math.tan(v.DEG2RAD * t.fov * 0.5) * t.aspect), o = i / Math.tan(v.DEG2RAD * t.fov * 0.5), r = i / Math.tan(s * 0.5);
    return 2 * Math.max(o, r);
  }
  // returns the transition threshold for orthographic zoom based on the globe size and camera settings
  _getOrthographicTransitionZoom() {
    const { camera: t, ellipsoid: e } = this;
    if (!t.isOrthographicCamera)
      throw new Error();
    const i = t.top - t.bottom, s = t.right - t.left, o = Math.max(i, s), n = 2 * Math.max(...e.radius);
    return 2 * o / n;
  }
  // returns the minimum allowed orthographic zoom based on the globe size and camera settings
  _getMinOrthographicZoom() {
    const { camera: t, ellipsoid: e } = this;
    if (!t.isOrthographicCamera)
      throw new Error();
    const i = t.top - t.bottom, s = t.right - t.left, o = Math.min(i, s), n = 2 * Math.max(...e.radius);
    return 0.7 * o / n;
  }
  // returns the "virtual position" of the orthographic based on where it is and
  // where it's looking primarily so we can reasonably position the camera object
  // in space and derive a reasonable "up" value.
  _getVirtualOrthoCameraPosition(t, e = this.camera) {
    const { ellipsoidFrame: i, ellipsoidFrameInverse: s, ellipsoid: o } = this;
    if (!e.isOrthographicCamera)
      throw new Error();
    w.origin.copy(e.position), w.direction.set(0, 0, -1).transformDirection(e.matrixWorld), w.applyMatrix4(s), o.closestPointToRayEstimate(w, N).applyMatrix4(i);
    const r = e.top - e.bottom, n = e.right - e.left, a = Math.max(r, n) / e.zoom;
    k.set(0, 0, -1).transformDirection(e.matrixWorld);
    const h = N.sub(e.position).dot(k);
    t.copy(e.position).addScaledVector(k, h - a * 4);
  }
  _isNearControls() {
    const { camera: t } = this;
    return t.isPerspectiveCamera ? this.getDistanceToCenter() < this._getPerspectiveTransitionDistance() : t.zoom > this._getOrthographicTransitionZoom();
  }
  _raycast(t) {
    const e = super._raycast(t);
    if (e === null) {
      const { ellipsoid: i, ellipsoidFrame: s, ellipsoidFrameInverse: o } = this;
      w.copy(t.ray).applyMatrix4(o);
      const r = i.intersectRay(w, P);
      return r !== null ? (r.applyMatrix4(s), {
        point: r.clone(),
        distance: r.distanceTo(t.ray.origin)
      }) : null;
    } else
      return e;
  }
}
const U = /* @__PURE__ */ new y(), nt = /* @__PURE__ */ new y(), rt = /* @__PURE__ */ new Ce(), Ci = /* @__PURE__ */ new y(), Si = /* @__PURE__ */ new y(), Ei = /* @__PURE__ */ new y(), Te = /* @__PURE__ */ new it(), Oi = /* @__PURE__ */ new it();
class Wi extends ft {
  get animating() {
    return this._alpha !== 0 && this._alpha !== 1;
  }
  get alpha() {
    return this._target === 0 ? 1 - this._alpha : this._alpha;
  }
  get camera() {
    return this._alpha === 0 ? this.perspectiveCamera : this._alpha === 1 ? this.orthographicCamera : this.transitionCamera;
  }
  get mode() {
    return this._target === 0 ? "perspective" : "orthographic";
  }
  set mode(t) {
    if (t === this.mode)
      return;
    const e = this.camera;
    t === "perspective" ? (this._target = 0, this._alpha = 0) : (this._target = 1, this._alpha = 1), this.dispatchEvent({ type: "camera-change", camera: this.camera, prevCamera: e });
  }
  constructor(t = new te(), e = new Ce()) {
    super(), this.perspectiveCamera = t, this.orthographicCamera = e, this.transitionCamera = new te(), this.orthographicPositionalZoom = !0, this.orthographicOffset = 50, this.fixedPoint = new y(), this.duration = 200, this.autoSync = !0, this.easeFunction = (i) => i, this._target = 0, this._alpha = 0, this._clock = new we();
  }
  toggle() {
    this._target = this._target === 1 ? 0 : 1, this._clock.getDelta(), this.dispatchEvent({ type: "toggle" });
  }
  update(t = Math.min(this._clock.getDelta(), 64 / 1e3)) {
    this.autoSync && this.syncCameras();
    const { perspectiveCamera: e, orthographicCamera: i, transitionCamera: s, camera: o } = this, r = t * 1e3;
    if (this._alpha !== this._target) {
      const l = Math.sign(this._target - this._alpha) * r / this.duration;
      this._alpha = v.clamp(this._alpha + l, 0, 1), this.dispatchEvent({ type: "change", alpha: this.alpha });
    }
    const n = o;
    let a = null;
    this._alpha === 0 ? a = e : this._alpha === 1 ? a = i : (a = s, this._updateTransitionCamera()), n !== a && (a === s && this.dispatchEvent({ type: "transition-start" }), this.dispatchEvent({ type: "camera-change", camera: a, prevCamera: n }), n === s && this.dispatchEvent({ type: "transition-end" }));
  }
  syncCameras() {
    const t = this._getFromCamera(), { perspectiveCamera: e, orthographicCamera: i, transitionCamera: s, fixedPoint: o } = this;
    if (U.set(0, 0, -1).transformDirection(t.matrixWorld).normalize(), t.isPerspectiveCamera) {
      if (this.orthographicPositionalZoom)
        i.position.copy(e.position).addScaledVector(U, -this.orthographicOffset), i.rotation.copy(e.rotation), i.updateMatrixWorld();
      else {
        const h = nt.subVectors(o, i.position).dot(U), l = nt.subVectors(o, e.position).dot(U);
        nt.copy(e.position).addScaledVector(U, l), i.rotation.copy(e.rotation), i.position.copy(nt).addScaledVector(U, -h), i.updateMatrixWorld();
      }
      const r = Math.abs(nt.subVectors(e.position, o).dot(U)), n = 2 * Math.tan(v.DEG2RAD * e.fov * 0.5) * r, a = i.top - i.bottom;
      i.zoom = a / n, i.updateProjectionMatrix();
    } else {
      const r = Math.abs(nt.subVectors(i.position, o).dot(U)), a = (i.top - i.bottom) / i.zoom * 0.5 / Math.tan(v.DEG2RAD * e.fov * 0.5);
      e.rotation.copy(i.rotation), e.position.copy(i.position).addScaledVector(U, r).addScaledVector(U, -a), e.updateMatrixWorld(), this.orthographicPositionalZoom && (i.position.copy(e.position).addScaledVector(U, -this.orthographicOffset), i.updateMatrixWorld());
    }
    s.position.copy(e.position), s.rotation.copy(e.rotation);
  }
  _getTransitionDirection() {
    return Math.sign(this._target - this._alpha);
  }
  _getToCamera() {
    const t = this._getTransitionDirection();
    return t === 0 ? this._target === 0 ? this.perspectiveCamera : this.orthographicCamera : t > 0 ? this.orthographicCamera : this.perspectiveCamera;
  }
  _getFromCamera() {
    const t = this._getTransitionDirection();
    return t === 0 ? this._target === 0 ? this.perspectiveCamera : this.orthographicCamera : t > 0 ? this.perspectiveCamera : this.orthographicCamera;
  }
  _updateTransitionCamera() {
    const { perspectiveCamera: t, orthographicCamera: e, transitionCamera: i, fixedPoint: s } = this, o = this.easeFunction(this._alpha);
    U.set(0, 0, -1).transformDirection(e.matrixWorld).normalize(), rt.copy(e), rt.position.addScaledVector(U, e.near), e.far -= e.near, e.near = 0, U.set(0, 0, -1).transformDirection(t.matrixWorld).normalize();
    const r = Math.abs(nt.subVectors(t.position, s).dot(U)), n = 2 * Math.tan(v.DEG2RAD * t.fov * 0.5) * r, a = Oi.slerpQuaternions(t.quaternion, rt.quaternion, o), h = v.lerp(t.fov, 1, o), l = n * 0.5 / Math.tan(v.DEG2RAD * h * 0.5), c = Ei.copy(rt.position).sub(s).applyQuaternion(Te.copy(rt.quaternion).invert()), p = Si.copy(t.position).sub(s).applyQuaternion(Te.copy(t.quaternion).invert()), f = Ci.lerpVectors(p, c, o);
    f.z -= Math.abs(f.z) - l;
    const u = -(p.z - f.z), d = -(c.z - f.z), x = v.lerp(u + t.near, d + rt.near, o), E = v.lerp(u + t.far, d + rt.far, o), _ = Math.max(E, 0) - Math.max(x, 0);
    i.aspect = t.aspect, i.fov = h, i.near = Math.max(x, _ * 1e-5), i.far = E, i.position.copy(f).applyQuaternion(a).add(s), i.quaternion.copy(a), i.updateProjectionMatrix(), i.updateMatrixWorld();
  }
}
export {
  Se as B,
  pi as C,
  Ti as E,
  Li as G,
  Oe as I,
  Ee as P,
  Vi as T,
  Wi as a
};
//# sourceMappingURL=CameraTransitionManager-raJsCcaV.js.map
