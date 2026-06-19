class z {
  get unloadPriorityCallback() {
    return this._unloadPriorityCallback;
  }
  set unloadPriorityCallback(t) {
    t.length === 1 ? (console.warn('LRUCache: "unloadPriorityCallback" function has been changed to take two arguments.'), this._unloadPriorityCallback = (a, e) => {
      const s = t(a), o = t(e);
      return s < o ? -1 : s > o ? 1 : 0;
    }) : this._unloadPriorityCallback = t;
  }
  constructor() {
    this.minSize = 6e3, this.maxSize = 8e3, this.minBytesSize = 0.3 * 1073741824, this.maxBytesSize = 0.4 * 1073741824, this.unloadPercent = 0.05, this.autoMarkUnused = !0, this.itemSet = /* @__PURE__ */ new Map(), this.itemList = [], this.usedSet = /* @__PURE__ */ new Set(), this.callbacks = /* @__PURE__ */ new Map(), this.unloadingHandle = -1, this.cachedBytes = 0, this.bytesMap = /* @__PURE__ */ new Map(), this.loadedSet = /* @__PURE__ */ new Set(), this._unloadPriorityCallback = null;
    const t = this.itemSet;
    this.defaultPriorityCallback = (a) => t.get(a);
  }
  // Returns whether or not the cache has reached the maximum size
  isFull() {
    return this.itemSet.size >= this.maxSize || this.cachedBytes >= this.maxBytesSize;
  }
  getMemoryUsage(t) {
    return this.bytesMap.get(t) || 0;
  }
  setMemoryUsage(t, a) {
    const { bytesMap: e, itemSet: s } = this;
    s.has(t) && (this.cachedBytes -= e.get(t) || 0, e.set(t, a), this.cachedBytes += a);
  }
  add(t, a) {
    const e = this.itemSet;
    if (e.has(t) || this.isFull())
      return !1;
    const s = this.usedSet, o = this.itemList, i = this.callbacks;
    return o.push(t), s.add(t), e.set(t, Date.now()), i.set(t, a), !0;
  }
  has(t) {
    return this.itemSet.has(t);
  }
  remove(t) {
    const a = this.usedSet, e = this.itemSet, s = this.itemList, o = this.bytesMap, i = this.callbacks, c = this.loadedSet;
    if (e.has(t)) {
      this.cachedBytes -= o.get(t) || 0, o.delete(t), i.get(t)(t);
      const d = s.indexOf(t);
      return s.splice(d, 1), a.delete(t), e.delete(t), i.delete(t), c.delete(t), !0;
    }
    return !1;
  }
  // Marks whether tiles in the cache have been completely loaded or not. Tiles that have not been completely
  // loaded are subject to being disposed early if the cache is full above its max size limits, even if they
  // are marked as used.
  setLoaded(t, a) {
    const { itemSet: e, loadedSet: s } = this;
    e.has(t) && (a === !0 ? s.add(t) : s.delete(t));
  }
  markUsed(t) {
    const a = this.itemSet, e = this.usedSet;
    a.has(t) && !e.has(t) && (a.set(t, Date.now()), e.add(t));
  }
  markUnused(t) {
    this.usedSet.delete(t);
  }
  markAllUnused() {
    this.usedSet.clear();
  }
  isUsed(t) {
    return this.usedSet.has(t);
  }
  // TODO: this should be renamed because it's not necessarily unloading all unused content
  // Maybe call it "cleanup" or "unloadToMinSize"
  unloadUnusedContent() {
    const {
      unloadPercent: t,
      minSize: a,
      maxSize: e,
      itemList: s,
      itemSet: o,
      usedSet: i,
      loadedSet: c,
      callbacks: d,
      bytesMap: u,
      minBytesSize: h,
      maxBytesSize: y
    } = this, b = s.length - i.size, B = s.length - c.size, S = Math.max(Math.min(s.length - a, b), 0), k = this.cachedBytes - h, M = this.unloadPriorityCallback || this.defaultPriorityCallback;
    let f = !1;
    const P = S > 0 && b > 0 || B && s.length > e;
    if (b && this.cachedBytes > h || B && this.cachedBytes > y || P) {
      s.sort((n, r) => {
        const U = i.has(n), L = i.has(r);
        if (U === L) {
          const x = c.has(n), v = c.has(r);
          return x === v ? -M(n, r) : x ? 1 : -1;
        } else
          return U ? 1 : -1;
      });
      const A = Math.max(a * t, S * t), p = Math.ceil(Math.min(A, b, S)), E = Math.max(t * k, t * h), w = Math.min(E, k);
      let l = 0, m = 0;
      for (; this.cachedBytes - m > y || s.length - l > e; ) {
        const n = s[l], r = u.get(n) || 0;
        if (i.has(n) && c.has(n) || this.cachedBytes - m - r < y && s.length - l <= e)
          break;
        m += r, l++;
      }
      for (; m < w || l < p; ) {
        const n = s[l], r = u.get(n) || 0;
        if (i.has(n) || this.cachedBytes - m - r < h && l >= p)
          break;
        m += r, l++;
      }
      s.splice(0, l).forEach((n) => {
        this.cachedBytes -= u.get(n) || 0, d.get(n)(n), u.delete(n), o.delete(n), d.delete(n), c.delete(n), i.delete(n);
      }), f = l < S || m < k && l < b, f = f && l > 0;
    }
    f && (this.unloadingHandle = requestAnimationFrame(() => this.scheduleUnload()));
  }
  scheduleUnload() {
    cancelAnimationFrame(this.unloadingHandle), this.scheduled || (this.scheduled = !0, queueMicrotask(() => {
      this.scheduled = !1, this.unloadUnusedContent();
    }));
  }
}
class C extends Error {
  constructor() {
    super("PriorityQueue: Item removed"), this.name = "PriorityQueueItemRemovedError";
  }
}
class G {
  // returns whether tasks are queued or actively running
  get running() {
    return this.items.length !== 0 || this.currJobs !== 0;
  }
  constructor() {
    this.maxJobs = 6, this.items = [], this.callbacks = /* @__PURE__ */ new Map(), this.currJobs = 0, this.scheduled = !1, this.autoUpdate = !0, this.priorityCallback = null, this.schedulingCallback = (t) => {
      requestAnimationFrame(t);
    }, this._runjobs = () => {
      this.scheduled = !1, this.tryRunJobs();
    };
  }
  sort() {
    const t = this.priorityCallback, a = this.items;
    t !== null && a.sort(t);
  }
  has(t) {
    return this.callbacks.has(t);
  }
  add(t, a) {
    const e = {
      callback: a,
      reject: null,
      resolve: null,
      promise: null
    };
    return e.promise = new Promise((s, o) => {
      const i = this.items, c = this.callbacks;
      e.resolve = s, e.reject = o, i.unshift(t), c.set(t, e), this.autoUpdate && this.scheduleJobRun();
    }), e.promise;
  }
  remove(t) {
    const a = this.items, e = this.callbacks, s = a.indexOf(t);
    if (s !== -1) {
      const o = e.get(t);
      o.promise.catch((i) => {
        if (!(i instanceof C))
          throw i;
      }), o.reject(new C()), a.splice(s, 1), e.delete(t);
    }
  }
  removeByFilter(t) {
    const { items: a } = this;
    for (let e = 0; e < a.length; e++) {
      const s = a[e];
      t(s) && (this.remove(s), e--);
    }
  }
  tryRunJobs() {
    this.sort();
    const t = this.items, a = this.callbacks, e = this.maxJobs;
    let s = 0;
    const o = () => {
      this.currJobs--, this.autoUpdate && this.scheduleJobRun();
    };
    for (; e > this.currJobs && t.length > 0 && s < e; ) {
      this.currJobs++, s++;
      const i = t.pop(), { callback: c, resolve: d, reject: u } = a.get(i);
      a.delete(i);
      let h;
      try {
        h = c(i);
      } catch (y) {
        u(y), o();
      }
      h instanceof Promise ? h.then(d).catch(u).finally(o) : (d(h), o());
    }
  }
  scheduleJobRun() {
    this.scheduled || (this.schedulingCallback(this._runjobs), this.scheduled = !0);
  }
}
const J = -1, I = 0, R = 1, _ = 2, D = 3, F = 4, N = 6378137, j = 1 / 298.257223563, Q = 6356752314245179e-9;
export {
  J as F,
  F as L,
  D as P,
  R as Q,
  I as U,
  j as W,
  _ as a,
  z as b,
  G as c,
  C as d,
  Q as e,
  N as f
};
//# sourceMappingURL=constants-Cj07Qhs1.js.map
