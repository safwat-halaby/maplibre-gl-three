function h(r, e = null, t = null) {
  const n = [];
  for (n.push(r), n.push(null), n.push(0); n.length > 0; ) {
    const o = n.pop(), i = n.pop(), s = n.pop();
    if (e && e(s, i, o)) {
      t && t(s, i, o);
      return;
    }
    const a = s.children;
    if (a)
      for (let l = a.length - 1; l >= 0; l--)
        n.push(a[l]), n.push(s), n.push(o + 1);
    t && t(s, i, o);
  }
}
function u(r, e = null) {
  let t = r;
  for (; t; ) {
    const n = t.internal.depth, o = t.parent;
    e && e(t, o, n), t = o;
  }
}
const g = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  traverseAncestors: u,
  traverseSet: h
}, Symbol.toStringTag, { value: "Module" }));
function d(r) {
  if (r === null || r.byteLength < 4)
    return "";
  let e;
  if (r instanceof DataView ? e = r : e = new DataView(r), String.fromCharCode(e.getUint8(0)) === "{")
    return null;
  let t = "";
  for (let n = 0; n < 4; n++)
    t += String.fromCharCode(e.getUint8(n));
  return t;
}
const p = new TextDecoder();
function f(r) {
  return p.decode(r);
}
function c(r) {
  return r.replace(/[\\/][^\\/]+$/, "") + "/";
}
const w = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  arrayToString: f,
  getWorkingPath: c,
  readMagicBytes: d
}, Symbol.toStringTag, { value: "Module" }));
class y {
  constructor() {
    this.fetchOptions = {}, this.workingPath = "";
  }
  load(...e) {
    return console.warn('Loader: "load" function has been deprecated in favor of "loadAsync".'), this.loadAsync(...e);
  }
  loadAsync(e) {
    return fetch(e, this.fetchOptions).then((t) => {
      if (!t.ok)
        throw new Error(`Failed to load file "${e}" with status ${t.status} : ${t.statusText}`);
      return t.arrayBuffer();
    }).then((t) => (this.workingPath === "" && (this.workingPath = c(e)), this.parse(t)));
  }
  resolveExternalURL(e) {
    return new URL(e, this.workingPath).href;
  }
  parse(e) {
    throw new Error("LoaderBase: Parse not implemented.");
  }
}
export {
  y as L,
  g as T,
  w as a,
  f as b,
  u as c,
  c as g,
  d as r,
  h as t
};
//# sourceMappingURL=LoaderBase-2yhE3Jur.js.map
