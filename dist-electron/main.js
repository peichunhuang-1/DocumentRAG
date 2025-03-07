var se = Object.defineProperty;
var ne = (t, e, r) => e in t ? se(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var R = (t, e, r) => ne(t, typeof e != "symbol" ? e + "" : e, r);
import { app as x, BrowserWindow as N, ipcMain as p, dialog as oe } from "electron";
import { createRequire as j } from "node:module";
import { fileURLToPath as ae } from "node:url";
import g, { resolve as L } from "node:path";
import * as b from "fs";
import * as w from "crypto";
import * as v from "path";
import ie, { promises as q } from "node:fs";
const ce = 1e5, le = 32, ue = "sha256", M = "aes-256-cbc", fe = process.env.HOME || process.env.USERPROFILE, z = v.join(fe || "/", ".research.go", "users");
function de(t) {
  b.existsSync(t) || b.mkdirSync(t, { recursive: !0 });
}
function he(t, e, r, s, n) {
  const o = v.join(z, t);
  de(o);
  const a = { publicKey: e, encryptedPrivateKey: r, salt: s, iv: n }, u = v.join(o, "user_data.json");
  return b.existsSync(u) ? (console.error("User name already used"), !1) : (b.writeFileSync(u, JSON.stringify(a), "utf-8"), !0);
}
function ye(t) {
  const e = v.join(z, t), r = v.join(e, "user_data.json");
  if (!b.existsSync(r))
    throw new Error(`User ${t} not found.`);
  const s = b.readFileSync(r, "utf-8");
  return JSON.parse(s);
}
function pe() {
  const { privateKey: t, publicKey: e } = w.generateKeyPairSync("ec", {
    namedCurve: "secp521r1",
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });
  return { privateKey: t, publicKey: e };
}
function J(t, e) {
  return w.pbkdf2Sync(t, e, ce, le, ue);
}
function me(t, e) {
  const r = w.randomBytes(16), s = w.createCipheriv(M, e, r);
  let n = s.update(t, "utf8", "hex");
  return n += s.final("hex"), { encryptedPrivateKey: n, iv: r.toString("hex") };
}
function we(t, e, r) {
  const s = w.createDecipheriv(M, e, Buffer.from(r, "hex"));
  let n = s.update(t, "hex", "utf8");
  return n += s.final("utf8"), n;
}
function be(t, e) {
  const r = w.randomBytes(16).toString("hex"), { privateKey: s, publicKey: n } = pe(), o = J(e, r), { encryptedPrivateKey: a, iv: u } = me(s, o);
  return he(t, n, a, r, u);
}
function ge(t, e) {
  try {
    const r = ye(t), s = J(e, r.salt);
    let n;
    try {
      n = we(r.encryptedPrivateKey, s, r.iv);
    } catch {
      return console.error("Invalid password or corrupted data"), !1;
    }
    const o = w.randomBytes(32).toString("hex"), a = w.createSign("SHA256");
    a.update(o), a.end();
    const u = a.sign(n, "hex"), y = w.createVerify("SHA256");
    return y.update(o), y.end(), y.verify(r.publicKey, u, "hex");
  } catch (r) {
    return console.error("Validation failed:", r), !1;
  }
}
var d = typeof globalThis < "u" && globalThis || typeof self < "u" && self || // eslint-disable-next-line no-undef
typeof global < "u" && global || {}, h = {
  searchParams: "URLSearchParams" in d,
  iterable: "Symbol" in d && "iterator" in Symbol,
  blob: "FileReader" in d && "Blob" in d && function() {
    try {
      return new Blob(), !0;
    } catch {
      return !1;
    }
  }(),
  formData: "FormData" in d,
  arrayBuffer: "ArrayBuffer" in d
};
function ve(t) {
  return t && DataView.prototype.isPrototypeOf(t);
}
if (h.arrayBuffer)
  var _e = [
    "[object Int8Array]",
    "[object Uint8Array]",
    "[object Uint8ClampedArray]",
    "[object Int16Array]",
    "[object Uint16Array]",
    "[object Int32Array]",
    "[object Uint32Array]",
    "[object Float32Array]",
    "[object Float64Array]"
  ], Ee = ArrayBuffer.isView || function(t) {
    return t && _e.indexOf(Object.prototype.toString.call(t)) > -1;
  };
function P(t) {
  if (typeof t != "string" && (t = String(t)), /[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(t) || t === "")
    throw new TypeError('Invalid character in header field name: "' + t + '"');
  return t.toLowerCase();
}
function $(t) {
  return typeof t != "string" && (t = String(t)), t;
}
function U(t) {
  var e = {
    next: function() {
      var r = t.shift();
      return { done: r === void 0, value: r };
    }
  };
  return h.iterable && (e[Symbol.iterator] = function() {
    return e;
  }), e;
}
function f(t) {
  this.map = {}, t instanceof f ? t.forEach(function(e, r) {
    this.append(r, e);
  }, this) : Array.isArray(t) ? t.forEach(function(e) {
    if (e.length != 2)
      throw new TypeError("Headers constructor: expected name/value pair to be length 2, found" + e.length);
    this.append(e[0], e[1]);
  }, this) : t && Object.getOwnPropertyNames(t).forEach(function(e) {
    this.append(e, t[e]);
  }, this);
}
f.prototype.append = function(t, e) {
  t = P(t), e = $(e);
  var r = this.map[t];
  this.map[t] = r ? r + ", " + e : e;
};
f.prototype.delete = function(t) {
  delete this.map[P(t)];
};
f.prototype.get = function(t) {
  return t = P(t), this.has(t) ? this.map[t] : null;
};
f.prototype.has = function(t) {
  return this.map.hasOwnProperty(P(t));
};
f.prototype.set = function(t, e) {
  this.map[P(t)] = $(e);
};
f.prototype.forEach = function(t, e) {
  for (var r in this.map)
    this.map.hasOwnProperty(r) && t.call(e, this.map[r], r, this);
};
f.prototype.keys = function() {
  var t = [];
  return this.forEach(function(e, r) {
    t.push(r);
  }), U(t);
};
f.prototype.values = function() {
  var t = [];
  return this.forEach(function(e) {
    t.push(e);
  }), U(t);
};
f.prototype.entries = function() {
  var t = [];
  return this.forEach(function(e, r) {
    t.push([r, e]);
  }), U(t);
};
h.iterable && (f.prototype[Symbol.iterator] = f.prototype.entries);
function T(t) {
  if (!t._noBody) {
    if (t.bodyUsed)
      return Promise.reject(new TypeError("Already read"));
    t.bodyUsed = !0;
  }
}
function G(t) {
  return new Promise(function(e, r) {
    t.onload = function() {
      e(t.result);
    }, t.onerror = function() {
      r(t.error);
    };
  });
}
function Ae(t) {
  var e = new FileReader(), r = G(e);
  return e.readAsArrayBuffer(t), r;
}
function Se(t) {
  var e = new FileReader(), r = G(e), s = /charset=([A-Za-z0-9_-]+)/.exec(t.type), n = s ? s[1] : "utf-8";
  return e.readAsText(t, n), r;
}
function Pe(t) {
  for (var e = new Uint8Array(t), r = new Array(e.length), s = 0; s < e.length; s++)
    r[s] = String.fromCharCode(e[s]);
  return r.join("");
}
function k(t) {
  if (t.slice)
    return t.slice(0);
  var e = new Uint8Array(t.byteLength);
  return e.set(new Uint8Array(t)), e.buffer;
}
function W() {
  return this.bodyUsed = !1, this._initBody = function(t) {
    this.bodyUsed = this.bodyUsed, this._bodyInit = t, t ? typeof t == "string" ? this._bodyText = t : h.blob && Blob.prototype.isPrototypeOf(t) ? this._bodyBlob = t : h.formData && FormData.prototype.isPrototypeOf(t) ? this._bodyFormData = t : h.searchParams && URLSearchParams.prototype.isPrototypeOf(t) ? this._bodyText = t.toString() : h.arrayBuffer && h.blob && ve(t) ? (this._bodyArrayBuffer = k(t.buffer), this._bodyInit = new Blob([this._bodyArrayBuffer])) : h.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(t) || Ee(t)) ? this._bodyArrayBuffer = k(t) : this._bodyText = t = Object.prototype.toString.call(t) : (this._noBody = !0, this._bodyText = ""), this.headers.get("content-type") || (typeof t == "string" ? this.headers.set("content-type", "text/plain;charset=UTF-8") : this._bodyBlob && this._bodyBlob.type ? this.headers.set("content-type", this._bodyBlob.type) : h.searchParams && URLSearchParams.prototype.isPrototypeOf(t) && this.headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8"));
  }, h.blob && (this.blob = function() {
    var t = T(this);
    if (t)
      return t;
    if (this._bodyBlob)
      return Promise.resolve(this._bodyBlob);
    if (this._bodyArrayBuffer)
      return Promise.resolve(new Blob([this._bodyArrayBuffer]));
    if (this._bodyFormData)
      throw new Error("could not read FormData body as blob");
    return Promise.resolve(new Blob([this._bodyText]));
  }), this.arrayBuffer = function() {
    if (this._bodyArrayBuffer) {
      var t = T(this);
      return t || (ArrayBuffer.isView(this._bodyArrayBuffer) ? Promise.resolve(
        this._bodyArrayBuffer.buffer.slice(
          this._bodyArrayBuffer.byteOffset,
          this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength
        )
      ) : Promise.resolve(this._bodyArrayBuffer));
    } else {
      if (h.blob)
        return this.blob().then(Ae);
      throw new Error("could not read as ArrayBuffer");
    }
  }, this.text = function() {
    var t = T(this);
    if (t)
      return t;
    if (this._bodyBlob)
      return Se(this._bodyBlob);
    if (this._bodyArrayBuffer)
      return Promise.resolve(Pe(this._bodyArrayBuffer));
    if (this._bodyFormData)
      throw new Error("could not read FormData body as text");
    return Promise.resolve(this._bodyText);
  }, h.formData && (this.formData = function() {
    return this.text().then(Te);
  }), this.json = function() {
    return this.text().then(JSON.parse);
  }, this;
}
var Re = ["CONNECT", "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT", "TRACE"];
function xe(t) {
  var e = t.toUpperCase();
  return Re.indexOf(e) > -1 ? e : t;
}
function A(t, e) {
  if (!(this instanceof A))
    throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
  e = e || {};
  var r = e.body;
  if (t instanceof A) {
    if (t.bodyUsed)
      throw new TypeError("Already read");
    this.url = t.url, this.credentials = t.credentials, e.headers || (this.headers = new f(t.headers)), this.method = t.method, this.mode = t.mode, this.signal = t.signal, !r && t._bodyInit != null && (r = t._bodyInit, t.bodyUsed = !0);
  } else
    this.url = String(t);
  if (this.credentials = e.credentials || this.credentials || "same-origin", (e.headers || !this.headers) && (this.headers = new f(e.headers)), this.method = xe(e.method || this.method || "GET"), this.mode = e.mode || this.mode || null, this.signal = e.signal || this.signal || function() {
    if ("AbortController" in d) {
      var o = new AbortController();
      return o.signal;
    }
  }(), this.referrer = null, (this.method === "GET" || this.method === "HEAD") && r)
    throw new TypeError("Body not allowed for GET or HEAD requests");
  if (this._initBody(r), (this.method === "GET" || this.method === "HEAD") && (e.cache === "no-store" || e.cache === "no-cache")) {
    var s = /([?&])_=[^&]*/;
    if (s.test(this.url))
      this.url = this.url.replace(s, "$1_=" + (/* @__PURE__ */ new Date()).getTime());
    else {
      var n = /\?/;
      this.url += (n.test(this.url) ? "&" : "?") + "_=" + (/* @__PURE__ */ new Date()).getTime();
    }
  }
}
A.prototype.clone = function() {
  return new A(this, { body: this._bodyInit });
};
function Te(t) {
  var e = new FormData();
  return t.trim().split("&").forEach(function(r) {
    if (r) {
      var s = r.split("="), n = s.shift().replace(/\+/g, " "), o = s.join("=").replace(/\+/g, " ");
      e.append(decodeURIComponent(n), decodeURIComponent(o));
    }
  }), e;
}
function Oe(t) {
  var e = new f(), r = t.replace(/\r?\n[\t ]+/g, " ");
  return r.split("\r").map(function(s) {
    return s.indexOf(`
`) === 0 ? s.substr(1, s.length) : s;
  }).forEach(function(s) {
    var n = s.split(":"), o = n.shift().trim();
    if (o) {
      var a = n.join(":").trim();
      try {
        e.append(o, a);
      } catch (u) {
        console.warn("Response " + u.message);
      }
    }
  }), e;
}
W.call(A.prototype);
function m(t, e) {
  if (!(this instanceof m))
    throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
  if (e || (e = {}), this.type = "default", this.status = e.status === void 0 ? 200 : e.status, this.status < 200 || this.status > 599)
    throw new RangeError("Failed to construct 'Response': The status provided (0) is outside the range [200, 599].");
  this.ok = this.status >= 200 && this.status < 300, this.statusText = e.statusText === void 0 ? "" : "" + e.statusText, this.headers = new f(e.headers), this.url = e.url || "", this._initBody(t);
}
W.call(m.prototype);
m.prototype.clone = function() {
  return new m(this._bodyInit, {
    status: this.status,
    statusText: this.statusText,
    headers: new f(this.headers),
    url: this.url
  });
};
m.error = function() {
  var t = new m(null, { status: 200, statusText: "" });
  return t.ok = !1, t.status = 0, t.type = "error", t;
};
var Ce = [301, 302, 303, 307, 308];
m.redirect = function(t, e) {
  if (Ce.indexOf(e) === -1)
    throw new RangeError("Invalid status code");
  return new m(null, { status: e, headers: { location: t } });
};
var E = d.DOMException;
try {
  new E();
} catch {
  E = function(e, r) {
    this.message = e, this.name = r;
    var s = Error(e);
    this.stack = s.stack;
  }, E.prototype = Object.create(Error.prototype), E.prototype.constructor = E;
}
function X(t, e) {
  return new Promise(function(r, s) {
    var n = new A(t, e);
    if (n.signal && n.signal.aborted)
      return s(new E("Aborted", "AbortError"));
    var o = new XMLHttpRequest();
    function a() {
      o.abort();
    }
    o.onload = function() {
      var i = {
        statusText: o.statusText,
        headers: Oe(o.getAllResponseHeaders() || "")
      };
      n.url.indexOf("file://") === 0 && (o.status < 200 || o.status > 599) ? i.status = 200 : i.status = o.status, i.url = "responseURL" in o ? o.responseURL : i.headers.get("X-Request-URL");
      var _ = "response" in o ? o.response : o.responseText;
      setTimeout(function() {
        r(new m(_, i));
      }, 0);
    }, o.onerror = function() {
      setTimeout(function() {
        s(new TypeError("Network request failed"));
      }, 0);
    }, o.ontimeout = function() {
      setTimeout(function() {
        s(new TypeError("Network request timed out"));
      }, 0);
    }, o.onabort = function() {
      setTimeout(function() {
        s(new E("Aborted", "AbortError"));
      }, 0);
    };
    function u(i) {
      try {
        return i === "" && d.location.href ? d.location.href : i;
      } catch {
        return i;
      }
    }
    if (o.open(n.method, u(n.url), !0), n.credentials === "include" ? o.withCredentials = !0 : n.credentials === "omit" && (o.withCredentials = !1), "responseType" in o && (h.blob ? o.responseType = "blob" : h.arrayBuffer && (o.responseType = "arraybuffer")), e && typeof e.headers == "object" && !(e.headers instanceof f || d.Headers && e.headers instanceof d.Headers)) {
      var y = [];
      Object.getOwnPropertyNames(e.headers).forEach(function(i) {
        y.push(P(i)), o.setRequestHeader(i, $(e.headers[i]));
      }), n.headers.forEach(function(i, _) {
        y.indexOf(_) === -1 && o.setRequestHeader(_, i);
      });
    } else
      n.headers.forEach(function(i, _) {
        o.setRequestHeader(_, i);
      });
    n.signal && (n.signal.addEventListener("abort", a), o.onreadystatechange = function() {
      o.readyState === 4 && n.signal.removeEventListener("abort", a);
    }), o.send(typeof n._bodyInit > "u" ? null : n._bodyInit);
  });
}
X.polyfill = !0;
d.fetch || (d.fetch = X, d.Headers = f, d.Request = A, d.Response = m);
const Be = "0.5.13", Z = "11434", Q = `http://127.0.0.1:${Z}`;
var De = Object.defineProperty, je = (t, e, r) => e in t ? De(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r, O = (t, e, r) => (je(t, typeof e != "symbol" ? e + "" : e, r), r);
class I extends Error {
  constructor(e, r) {
    super(e), this.error = e, this.status_code = r, this.name = "ResponseError", Error.captureStackTrace && Error.captureStackTrace(this, I);
  }
}
class $e {
  constructor(e, r, s) {
    O(this, "abortController"), O(this, "itr"), O(this, "doneCallback"), this.abortController = e, this.itr = r, this.doneCallback = s;
  }
  abort() {
    this.abortController.abort();
  }
  async *[Symbol.asyncIterator]() {
    for await (const e of this.itr) {
      if ("error" in e)
        throw new Error(e.error);
      if (yield e, e.done || e.status === "success") {
        this.doneCallback();
        return;
      }
    }
    throw new Error("Did not receive done or success response in stream.");
  }
}
const F = async (t) => {
  var s;
  if (t.ok)
    return;
  let e = `Error ${t.status}: ${t.statusText}`, r = null;
  if ((s = t.headers.get("content-type")) != null && s.includes("application/json"))
    try {
      r = await t.json(), e = r.error || e;
    } catch {
      console.log("Failed to parse error response as JSON");
    }
  else
    try {
      console.log("Getting text from response"), e = await t.text() || e;
    } catch {
      console.log("Failed to get text from error response");
    }
  throw new I(e, t.status);
};
function Ue() {
  return typeof window < "u" && window.navigator ? `${window.navigator.platform.toLowerCase()} Browser/${navigator.userAgent};` : typeof process < "u" ? `${process.arch} ${process.platform} Node.js/${process.version}` : "";
}
const H = async (t, e, r = {}) => {
  const s = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": `ollama-js/${Be} (${Ue()})`
  };
  r.headers || (r.headers = {});
  const n = Object.fromEntries(
    Object.entries(r.headers).filter(([o]) => !Object.keys(s).some((a) => a.toLowerCase() === o.toLowerCase()))
  );
  return r.headers = {
    ...s,
    ...n
  }, t(e, r);
}, V = async (t, e, r) => {
  const s = await H(t, e, {
    headers: r == null ? void 0 : r.headers
  });
  return await F(s), s;
}, S = async (t, e, r, s) => {
  const o = ((u) => u !== null && typeof u == "object" && !Array.isArray(u))(r) ? JSON.stringify(r) : r, a = await H(t, e, {
    method: "POST",
    body: o,
    signal: s == null ? void 0 : s.signal,
    headers: s == null ? void 0 : s.headers
  });
  return await F(a), a;
}, Ie = async (t, e, r, s) => {
  const n = await H(t, e, {
    method: "DELETE",
    body: JSON.stringify(r),
    headers: s == null ? void 0 : s.headers
  });
  return await F(n), n;
}, Fe = async function* (t) {
  const e = new TextDecoder("utf-8");
  let r = "";
  const s = t.getReader();
  for (; ; ) {
    const { done: n, value: o } = await s.read();
    if (n)
      break;
    r += e.decode(o);
    const a = r.split(`
`);
    r = a.pop() ?? "";
    for (const u of a)
      try {
        yield JSON.parse(u);
      } catch {
        console.warn("invalid json: ", u);
      }
  }
  for (const n of r.split(`
`).filter((o) => o !== ""))
    try {
      yield JSON.parse(n);
    } catch {
      console.warn("invalid json: ", n);
    }
}, He = (t) => {
  if (!t)
    return Q;
  let e = t.includes("://");
  t.startsWith(":") && (t = `http://127.0.0.1${t}`, e = !0), e || (t = `http://${t}`);
  const r = new URL(t);
  let s = r.port;
  s || (e ? s = r.protocol === "https:" ? "443" : "80" : s = Z);
  let n = `${r.protocol}//${r.hostname}:${s}${r.pathname}`;
  return n.endsWith("/") && (n = n.slice(0, -1)), n;
};
var Le = Object.defineProperty, qe = (t, e, r) => e in t ? Le(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r, C = (t, e, r) => (qe(t, typeof e != "symbol" ? e + "" : e, r), r);
let Y = class {
  constructor(e) {
    C(this, "config"), C(this, "fetch"), C(this, "ongoingStreamedRequests", []), this.config = {
      host: "",
      headers: e == null ? void 0 : e.headers
    }, e != null && e.proxy || (this.config.host = He((e == null ? void 0 : e.host) ?? Q)), this.fetch = (e == null ? void 0 : e.fetch) ?? fetch;
  }
  // Abort any ongoing streamed requests to Ollama
  abort() {
    for (const e of this.ongoingStreamedRequests)
      e.abort();
    this.ongoingStreamedRequests.length = 0;
  }
  /**
   * Processes a request to the Ollama server. If the request is streamable, it will return a
   * AbortableAsyncIterator that yields the response messages. Otherwise, it will return the response
   * object.
   * @param endpoint {string} - The endpoint to send the request to.
   * @param request {object} - The request object to send to the endpoint.
   * @protected {T | AbortableAsyncIterator<T>} - The response object or a AbortableAsyncIterator that yields
   * response messages.
   * @throws {Error} - If the response body is missing or if the response is an error.
   * @returns {Promise<T | AbortableAsyncIterator<T>>} - The response object or a AbortableAsyncIterator that yields the streamed response.
   */
  async processStreamableRequest(e, r) {
    r.stream = r.stream ?? !1;
    const s = `${this.config.host}/api/${e}`;
    if (r.stream) {
      const o = new AbortController(), a = await S(this.fetch, s, r, {
        signal: o.signal,
        headers: this.config.headers
      });
      if (!a.body)
        throw new Error("Missing body");
      const u = Fe(a.body), y = new $e(
        o,
        u,
        () => {
          const i = this.ongoingStreamedRequests.indexOf(y);
          i > -1 && this.ongoingStreamedRequests.splice(i, 1);
        }
      );
      return this.ongoingStreamedRequests.push(y), y;
    }
    return await (await S(this.fetch, s, r, {
      headers: this.config.headers
    })).json();
  }
  /**
   * Encodes an image to base64 if it is a Uint8Array.
   * @param image {Uint8Array | string} - The image to encode.
   * @returns {Promise<string>} - The base64 encoded image.
   */
  async encodeImage(e) {
    if (typeof e != "string") {
      const r = new Uint8Array(e);
      let s = "";
      const n = r.byteLength;
      for (let o = 0; o < n; o++)
        s += String.fromCharCode(r[o]);
      return btoa(s);
    }
    return e;
  }
  /**
   * Generates a response from a text prompt.
   * @param request {GenerateRequest} - The request object.
   * @returns {Promise<GenerateResponse | AbortableAsyncIterator<GenerateResponse>>} - The response object or
   * an AbortableAsyncIterator that yields response messages.
   */
  async generate(e) {
    return e.images && (e.images = await Promise.all(e.images.map(this.encodeImage.bind(this)))), this.processStreamableRequest("generate", e);
  }
  /**
   * Chats with the model. The request object can contain messages with images that are either
   * Uint8Arrays or base64 encoded strings. The images will be base64 encoded before sending the
   * request.
   * @param request {ChatRequest} - The request object.
   * @returns {Promise<ChatResponse | AbortableAsyncIterator<ChatResponse>>} - The response object or an
   * AbortableAsyncIterator that yields response messages.
   */
  async chat(e) {
    if (e.messages)
      for (const r of e.messages)
        r.images && (r.images = await Promise.all(
          r.images.map(this.encodeImage.bind(this))
        ));
    return this.processStreamableRequest("chat", e);
  }
  /**
   * Creates a new model from a stream of data.
   * @param request {CreateRequest} - The request object.
   * @returns {Promise<ProgressResponse | AbortableAsyncIterator<ProgressResponse>>} - The response object or a stream of progress responses.
   */
  async create(e) {
    return this.processStreamableRequest("create", {
      ...e
    });
  }
  /**
   * Pulls a model from the Ollama registry. The request object can contain a stream flag to indicate if the
   * response should be streamed.
   * @param request {PullRequest} - The request object.
   * @returns {Promise<ProgressResponse | AbortableAsyncIterator<ProgressResponse>>} - The response object or
   * an AbortableAsyncIterator that yields response messages.
   */
  async pull(e) {
    return this.processStreamableRequest("pull", {
      name: e.model,
      stream: e.stream,
      insecure: e.insecure
    });
  }
  /**
   * Pushes a model to the Ollama registry. The request object can contain a stream flag to indicate if the
   * response should be streamed.
   * @param request {PushRequest} - The request object.
   * @returns {Promise<ProgressResponse | AbortableAsyncIterator<ProgressResponse>>} - The response object or
   * an AbortableAsyncIterator that yields response messages.
   */
  async push(e) {
    return this.processStreamableRequest("push", {
      name: e.model,
      stream: e.stream,
      insecure: e.insecure
    });
  }
  /**
   * Deletes a model from the server. The request object should contain the name of the model to
   * delete.
   * @param request {DeleteRequest} - The request object.
   * @returns {Promise<StatusResponse>} - The response object.
   */
  async delete(e) {
    return await Ie(
      this.fetch,
      `${this.config.host}/api/delete`,
      { name: e.model },
      { headers: this.config.headers }
    ), { status: "success" };
  }
  /**
   * Copies a model from one name to another. The request object should contain the name of the
   * model to copy and the new name.
   * @param request {CopyRequest} - The request object.
   * @returns {Promise<StatusResponse>} - The response object.
   */
  async copy(e) {
    return await S(this.fetch, `${this.config.host}/api/copy`, { ...e }, {
      headers: this.config.headers
    }), { status: "success" };
  }
  /**
   * Lists the models on the server.
   * @returns {Promise<ListResponse>} - The response object.
   * @throws {Error} - If the response body is missing.
   */
  async list() {
    return await (await V(this.fetch, `${this.config.host}/api/tags`, {
      headers: this.config.headers
    })).json();
  }
  /**
   * Shows the metadata of a model. The request object should contain the name of the model.
   * @param request {ShowRequest} - The request object.
   * @returns {Promise<ShowResponse>} - The response object.
   */
  async show(e) {
    return await (await S(this.fetch, `${this.config.host}/api/show`, {
      ...e
    }, {
      headers: this.config.headers
    })).json();
  }
  /**
   * Embeds text input into vectors.
   * @param request {EmbedRequest} - The request object.
   * @returns {Promise<EmbedResponse>} - The response object.
   */
  async embed(e) {
    return await (await S(this.fetch, `${this.config.host}/api/embed`, {
      ...e
    }, {
      headers: this.config.headers
    })).json();
  }
  /**
   * Embeds a text prompt into a vector.
   * @param request {EmbeddingsRequest} - The request object.
   * @returns {Promise<EmbeddingsResponse>} - The response object.
   */
  async embeddings(e) {
    return await (await S(this.fetch, `${this.config.host}/api/embeddings`, {
      ...e
    }, {
      headers: this.config.headers
    })).json();
  }
  /**
   * Lists the running models on the server
   * @returns {Promise<ListResponse>} - The response object.
   * @throws {Error} - If the response body is missing.
   */
  async ps() {
    return await (await V(this.fetch, `${this.config.host}/api/ps`, {
      headers: this.config.headers
    })).json();
  }
};
new Y();
class ke extends Y {
  async encodeImage(e) {
    if (typeof e != "string")
      return Buffer.from(e).toString("base64");
    try {
      if (ie.existsSync(e)) {
        const r = await q.readFile(L(e));
        return Buffer.from(r).toString("base64");
      }
    } catch {
    }
    return e;
  }
  /**
   * checks if a file exists
   * @param path {string} - The path to the file
   * @private @internal
   * @returns {Promise<boolean>} - Whether the file exists or not
   */
  async fileExists(e) {
    try {
      return await q.access(e), !0;
    } catch {
      return !1;
    }
  }
  async create(e) {
    if (e.from && await this.fileExists(L(e.from)))
      throw Error("Creating with a local path is not currently supported from ollama-js");
    return e.stream ? super.create(e) : super.create(e);
  }
}
const Ve = new ke(), Ke = j(import.meta.url), Ne = Ke("dockerode"), B = new Ne(), Me = process.env.HOME || process.env.USERPROFILE, ze = v.join(Me || "/", ".research.go", "users"), Je = [
  { name: "robwilkes/unstructured-api", port: "5051", internalPort: "8000" },
  { name: "chromadb/chroma", port: "5050", internalPort: "8000" }
];
function Ge(t) {
  b.existsSync(t) || b.mkdirSync(t, { recursive: !0 });
}
async function We(t) {
  try {
    await B.getImage(t).inspect(), console.log(`${t} already exists.`);
  } catch {
    console.log(`${t} not found, pulling...`), await B.pull(t), console.log(`${t} pulled successfully.`);
  }
}
async function K(t, e, r, s, n) {
  const o = {
    Image: t,
    Env: n || [],
    HostConfig: {
      PortBindings: {
        [`${r}/tcp`]: [{ HostPort: e }]
      },
      Binds: s ? [s] : [],
      AutoRemove: !0
    }
  }, a = await B.createContainer(o);
  return await a.start(), console.log(`${t} container started and port ${e} mapped to host.`), a;
}
async function Xe(t) {
  for (let e of t)
    await e.stop(), console.log("Container stopped.");
}
async function Ze(t) {
  const e = v.join(ze, t.name), r = v.join(e, "index");
  console.log(`volume: ${r}`), Ge(r);
  try {
    await Promise.all(Je.map((o) => We(o.name)));
    const s = await K("robwilkes/unstructured-api", "5051", "8000"), n = await K("chromadb/chroma", "5050", "8000", `${r}:/chroma/chroma:rw`, ['CHROMA_SERVER_CORS_ALLOW_ORIGINS=["http://localhost:*"]']);
    return [s, n];
  } catch (s) {
    throw console.error("Error during docker operations: ", s), s;
  }
}
const Qe = j(import.meta.url), { ChromaClient: Ye, OllamaEmbeddingFunction: et } = Qe("chromadb");
class tt {
  constructor() {
    R(this, "client");
    R(this, "embeddingFunc");
    R(this, "session_history");
    R(this, "pdf_db");
    this.client = new Ye({ path: "http://localhost:5050" }), this.embeddingFunc = new et({
      url: "http://localhost:11434/api/embeddings",
      model: "mxbai-embed-large"
    }), this.session_history = null, this.pdf_db = null;
  }
  async connect() {
    this.client || (await new Promise((e) => setTimeout(e, 1e3)), await this.connect());
  }
  async getClient() {
    return await this.connect(), this.client;
  }
  async getSessionHistory(e) {
    this.session_history = await (await this.getClient()).getOrCreateCollection({
      name: e,
      embeddingFunction: this.embeddingFunc
    });
  }
  async addSessionHistory(e, r, s) {
    if (this.session_history) {
      const n = await this.embeddingFunc.generate(e);
      return await this.session_history.add({
        ids: r,
        documents: e,
        embeddings: n,
        metadatas: [{ user: s }]
      }), !0;
    } else return !1;
  }
  async querySessionHistory(e, r, s) {
    if (this.session_history) {
      const n = await this.embeddingFunc.generate([e]);
      return await this.session_history.query({
        nResults: r,
        queryEmbeddings: n,
        where: { user: s }
      });
    } else return [];
  }
  async getPdfDataBase() {
    this.pdf_db = await this.client.getOrCreateCollection({
      name: "pdf",
      embeddingFunction: this.embeddingFunc
    });
  }
  async addPdfData(e, r, s = null) {
    if (this.pdf_db) {
      const n = await this.embeddingFunc.generate(e);
      return await this.pdf_db.add({
        ids: r,
        documents: e,
        embeddings: n
        // metadatas: metas? metas: {},
      }), !0;
    } else return !1;
  }
  async queryPdfSegment(e, r, s = null) {
    if (this.pdf_db) {
      const n = await this.embeddingFunc.generate([e]);
      return await this.pdf_db.query({
        nResults: r,
        queryEmbeddings: n
        // where: metas? metas: {},
      });
    } else return [];
  }
  isValid() {
    return this.pdf_db !== null && this.session_history !== null;
  }
}
j(import.meta.url);
const ee = g.dirname(ae(import.meta.url));
process.env.APP_ROOT = g.join(ee, "..");
const D = process.env.VITE_DEV_SERVER_URL, lt = g.join(process.env.APP_ROOT, "dist-electron"), te = g.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = D ? g.join(process.env.APP_ROOT, "public") : te;
let c, l = null;
function re() {
  c = new N({
    icon: g.join(process.env.VITE_PUBLIC, "logo.png"),
    webPreferences: {
      preload: g.join(ee, "preload.mjs")
    }
  }), c.webContents.session.webRequest.onHeadersReceived((t, e) => {
    let r = t.responseHeaders;
    if (!r) {
      console.error("Response without header");
      return;
    }
    t.url.includes("localhost") && (r["Access-Control-Allow-Origin"] = ["*"], r["Access-Control-Allow-Headers"] = ["*"], r["Access-Control-Allow-Methods"] = ["GET, POST, PUT, DELETE"]), e({ responseHeaders: r });
  }), c.webContents.on("did-finish-load", () => {
    c == null || c.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), D ? c.loadURL(D) : c.loadFile(g.join(te, "index.html"));
}
x.on("window-all-closed", () => {
  process.platform !== "darwin" && (x.quit(), c = null);
});
x.on("activate", () => {
  N.getAllWindows().length === 0 && re();
});
x.whenReady().then(re);
p.handle("open-file-dialog", async () => {
  if (c) {
    const t = await oe.showOpenDialog(c, {
      title: "Choose file",
      buttonLabel: "Open",
      properties: ["openFile"],
      filters: [{ name: "Document", extensions: ["pdf"] }]
    });
    return t.filePaths.length > 0 ? t.filePaths[0] : null;
  } else
    return null;
});
p.handle("open-file", (t, e) => c ? b.readFileSync(e) : null);
p.handle("regist", (t, e) => c ? be(e.name, e.password) : !1);
p.handle("validate-user", (t, e) => c ? ge(e.name, e.password) : !1);
p.handle("prompt-llm", async (t, e) => {
  if (c) {
    const r = await Ve.chat({
      model: e.model ? e.model : "llama3",
      messages: [{ role: e.user ? e.user : "user", content: e.content }],
      stream: !0
    });
    for await (const s of r)
      t.sender.send("llm-stream", s.message.content);
  } else
    return;
});
p.handle("launch-docker-containers", async (t, e) => {
  if (c)
    try {
      const r = await Ze(e);
      return x.on("window-all-closed", async () => {
        await Xe(r);
      }), !0;
    } catch {
      return !1;
    }
  else
    return !1;
});
p.handle("create-chroma-client", async (t, e) => {
  if (c) {
    l = new tt(), await l.getSessionHistory(e), await l.getPdfDataBase();
    var r = l.isValid();
    return r;
  } else
    return !1;
});
p.handle("add-session-history", async (t, e) => {
  c && l != null && l.isValid() ? await l.addSessionHistory(e.prompts, e.ids, e.user) : console.error("Conversation is not memorized");
});
p.handle("query-session-history", async (t, e) => c ? l != null && l.isValid() ? await l.querySessionHistory(e.content, e.nResults, e.user) : (console.error("Cannot query converation history"), []) : (console.error("Cannot query converation history"), []));
p.handle("add-knowledge", async (t, e) => {
  c && l != null && l.isValid() ? await l.addPdfData(e.data, e.ids, e.meta) : console.error("Knowledge is not memorized");
});
p.handle("query-knowledge", async (t, e) => c ? l != null && l.isValid() ? await l.queryPdfSegment(e.content, e.nResults, e.meta) : (console.error("Cannot query pre-knowledge"), []) : (console.error("Cannot query pre-knowledge"), []));
export {
  lt as MAIN_DIST,
  te as RENDERER_DIST,
  D as VITE_DEV_SERVER_URL
};
