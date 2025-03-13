var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path$1, { resolve } from "node:path";
import * as fs from "fs";
import * as crypto from "crypto";
import * as path from "path";
import fs$1, { promises } from "node:fs";
import { webcrypto } from "node:crypto";
const iterations = 1e5;
const keyLength = 32;
const digest = "sha256";
const encryptionAlgorithm = "aes-256-cbc";
const __root__$2 = process.env.HOME || process.env.USERPROFILE;
const __dir__$2 = path.join(__root__$2 || "/", ".research.go", "users");
function ensureDirectoryExists$1(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
function saveUserData(user_name, publicKey, encryptedPrivateKey, salt, iv) {
  const userDir = path.join(__dir__$2, user_name);
  ensureDirectoryExists$1(userDir);
  const userData = { publicKey, encryptedPrivateKey, salt, iv };
  const filePath = path.join(userDir, "user_data.json");
  if (fs.existsSync(filePath)) {
    console.error("User name already used");
    return false;
  } else {
    fs.writeFileSync(filePath, JSON.stringify(userData), "utf-8");
    return true;
  }
}
function loadUserData(user_name) {
  const userDir = path.join(__dir__$2, user_name);
  const filePath = path.join(userDir, "user_data.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(`User ${user_name} not found.`);
  }
  const userData = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(userData);
}
function generateKeyPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "secp521r1",
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });
  return { privateKey, publicKey };
}
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest);
}
function encryptPrivateKey(privateKey, derivedKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(encryptionAlgorithm, derivedKey, iv);
  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  return { encryptedPrivateKey: encrypted, iv: iv.toString("hex") };
}
function decryptPrivateKey(encryptedPrivateKey, derivedKey, iv) {
  const decipher = crypto.createDecipheriv(encryptionAlgorithm, derivedKey, Buffer.from(iv, "hex"));
  let decrypted = decipher.update(encryptedPrivateKey, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
function registerUser(user_name, password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const { privateKey, publicKey } = generateKeyPair();
  const derivedKey = deriveKey(password, salt);
  const { encryptedPrivateKey, iv } = encryptPrivateKey(privateKey, derivedKey);
  return saveUserData(user_name, publicKey, encryptedPrivateKey, salt, iv);
}
function validateUser(user_name, password) {
  try {
    const user = loadUserData(user_name);
    const derivedKey = deriveKey(password, user.salt);
    let privateKey;
    try {
      privateKey = decryptPrivateKey(user.encryptedPrivateKey, derivedKey, user.iv);
    } catch (error) {
      console.error("Invalid password or corrupted data");
      return false;
    }
    const challenge = crypto.randomBytes(32).toString("hex");
    const sign = crypto.createSign("SHA256");
    sign.update(challenge);
    sign.end();
    const signature = sign.sign(privateKey, "hex");
    const verify = crypto.createVerify("SHA256");
    verify.update(challenge);
    verify.end();
    return verify.verify(user.publicKey, signature, "hex");
  } catch (error) {
    console.error("Validation failed:", error);
    return false;
  }
}
var g = typeof globalThis !== "undefined" && globalThis || typeof self !== "undefined" && self || // eslint-disable-next-line no-undef
typeof global !== "undefined" && global || {};
var support = {
  searchParams: "URLSearchParams" in g,
  iterable: "Symbol" in g && "iterator" in Symbol,
  blob: "FileReader" in g && "Blob" in g && function() {
    try {
      new Blob();
      return true;
    } catch (e) {
      return false;
    }
  }(),
  formData: "FormData" in g,
  arrayBuffer: "ArrayBuffer" in g
};
function isDataView(obj) {
  return obj && DataView.prototype.isPrototypeOf(obj);
}
if (support.arrayBuffer) {
  var viewClasses = [
    "[object Int8Array]",
    "[object Uint8Array]",
    "[object Uint8ClampedArray]",
    "[object Int16Array]",
    "[object Uint16Array]",
    "[object Int32Array]",
    "[object Uint32Array]",
    "[object Float32Array]",
    "[object Float64Array]"
  ];
  var isArrayBufferView = ArrayBuffer.isView || function(obj) {
    return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
  };
}
function normalizeName(name) {
  if (typeof name !== "string") {
    name = String(name);
  }
  if (/[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(name) || name === "") {
    throw new TypeError('Invalid character in header field name: "' + name + '"');
  }
  return name.toLowerCase();
}
function normalizeValue(value) {
  if (typeof value !== "string") {
    value = String(value);
  }
  return value;
}
function iteratorFor(items) {
  var iterator = {
    next: function() {
      var value = items.shift();
      return { done: value === void 0, value };
    }
  };
  if (support.iterable) {
    iterator[Symbol.iterator] = function() {
      return iterator;
    };
  }
  return iterator;
}
function Headers(headers) {
  this.map = {};
  if (headers instanceof Headers) {
    headers.forEach(function(value, name) {
      this.append(name, value);
    }, this);
  } else if (Array.isArray(headers)) {
    headers.forEach(function(header) {
      if (header.length != 2) {
        throw new TypeError("Headers constructor: expected name/value pair to be length 2, found" + header.length);
      }
      this.append(header[0], header[1]);
    }, this);
  } else if (headers) {
    Object.getOwnPropertyNames(headers).forEach(function(name) {
      this.append(name, headers[name]);
    }, this);
  }
}
Headers.prototype.append = function(name, value) {
  name = normalizeName(name);
  value = normalizeValue(value);
  var oldValue = this.map[name];
  this.map[name] = oldValue ? oldValue + ", " + value : value;
};
Headers.prototype["delete"] = function(name) {
  delete this.map[normalizeName(name)];
};
Headers.prototype.get = function(name) {
  name = normalizeName(name);
  return this.has(name) ? this.map[name] : null;
};
Headers.prototype.has = function(name) {
  return this.map.hasOwnProperty(normalizeName(name));
};
Headers.prototype.set = function(name, value) {
  this.map[normalizeName(name)] = normalizeValue(value);
};
Headers.prototype.forEach = function(callback, thisArg) {
  for (var name in this.map) {
    if (this.map.hasOwnProperty(name)) {
      callback.call(thisArg, this.map[name], name, this);
    }
  }
};
Headers.prototype.keys = function() {
  var items = [];
  this.forEach(function(value, name) {
    items.push(name);
  });
  return iteratorFor(items);
};
Headers.prototype.values = function() {
  var items = [];
  this.forEach(function(value) {
    items.push(value);
  });
  return iteratorFor(items);
};
Headers.prototype.entries = function() {
  var items = [];
  this.forEach(function(value, name) {
    items.push([name, value]);
  });
  return iteratorFor(items);
};
if (support.iterable) {
  Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
}
function consumed(body) {
  if (body._noBody) return;
  if (body.bodyUsed) {
    return Promise.reject(new TypeError("Already read"));
  }
  body.bodyUsed = true;
}
function fileReaderReady(reader) {
  return new Promise(function(resolve2, reject) {
    reader.onload = function() {
      resolve2(reader.result);
    };
    reader.onerror = function() {
      reject(reader.error);
    };
  });
}
function readBlobAsArrayBuffer(blob) {
  var reader = new FileReader();
  var promise = fileReaderReady(reader);
  reader.readAsArrayBuffer(blob);
  return promise;
}
function readBlobAsText(blob) {
  var reader = new FileReader();
  var promise = fileReaderReady(reader);
  var match = /charset=([A-Za-z0-9_-]+)/.exec(blob.type);
  var encoding = match ? match[1] : "utf-8";
  reader.readAsText(blob, encoding);
  return promise;
}
function readArrayBufferAsText(buf) {
  var view = new Uint8Array(buf);
  var chars = new Array(view.length);
  for (var i = 0; i < view.length; i++) {
    chars[i] = String.fromCharCode(view[i]);
  }
  return chars.join("");
}
function bufferClone(buf) {
  if (buf.slice) {
    return buf.slice(0);
  } else {
    var view = new Uint8Array(buf.byteLength);
    view.set(new Uint8Array(buf));
    return view.buffer;
  }
}
function Body() {
  this.bodyUsed = false;
  this._initBody = function(body) {
    this.bodyUsed = this.bodyUsed;
    this._bodyInit = body;
    if (!body) {
      this._noBody = true;
      this._bodyText = "";
    } else if (typeof body === "string") {
      this._bodyText = body;
    } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
      this._bodyBlob = body;
    } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
      this._bodyFormData = body;
    } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
      this._bodyText = body.toString();
    } else if (support.arrayBuffer && support.blob && isDataView(body)) {
      this._bodyArrayBuffer = bufferClone(body.buffer);
      this._bodyInit = new Blob([this._bodyArrayBuffer]);
    } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
      this._bodyArrayBuffer = bufferClone(body);
    } else {
      this._bodyText = body = Object.prototype.toString.call(body);
    }
    if (!this.headers.get("content-type")) {
      if (typeof body === "string") {
        this.headers.set("content-type", "text/plain;charset=UTF-8");
      } else if (this._bodyBlob && this._bodyBlob.type) {
        this.headers.set("content-type", this._bodyBlob.type);
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this.headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8");
      }
    }
  };
  if (support.blob) {
    this.blob = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected;
      }
      if (this._bodyBlob) {
        return Promise.resolve(this._bodyBlob);
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(new Blob([this._bodyArrayBuffer]));
      } else if (this._bodyFormData) {
        throw new Error("could not read FormData body as blob");
      } else {
        return Promise.resolve(new Blob([this._bodyText]));
      }
    };
  }
  this.arrayBuffer = function() {
    if (this._bodyArrayBuffer) {
      var isConsumed = consumed(this);
      if (isConsumed) {
        return isConsumed;
      } else if (ArrayBuffer.isView(this._bodyArrayBuffer)) {
        return Promise.resolve(
          this._bodyArrayBuffer.buffer.slice(
            this._bodyArrayBuffer.byteOffset,
            this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength
          )
        );
      } else {
        return Promise.resolve(this._bodyArrayBuffer);
      }
    } else if (support.blob) {
      return this.blob().then(readBlobAsArrayBuffer);
    } else {
      throw new Error("could not read as ArrayBuffer");
    }
  };
  this.text = function() {
    var rejected = consumed(this);
    if (rejected) {
      return rejected;
    }
    if (this._bodyBlob) {
      return readBlobAsText(this._bodyBlob);
    } else if (this._bodyArrayBuffer) {
      return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));
    } else if (this._bodyFormData) {
      throw new Error("could not read FormData body as text");
    } else {
      return Promise.resolve(this._bodyText);
    }
  };
  if (support.formData) {
    this.formData = function() {
      return this.text().then(decode);
    };
  }
  this.json = function() {
    return this.text().then(JSON.parse);
  };
  return this;
}
var methods = ["CONNECT", "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT", "TRACE"];
function normalizeMethod(method) {
  var upcased = method.toUpperCase();
  return methods.indexOf(upcased) > -1 ? upcased : method;
}
function Request(input, options) {
  if (!(this instanceof Request)) {
    throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
  }
  options = options || {};
  var body = options.body;
  if (input instanceof Request) {
    if (input.bodyUsed) {
      throw new TypeError("Already read");
    }
    this.url = input.url;
    this.credentials = input.credentials;
    if (!options.headers) {
      this.headers = new Headers(input.headers);
    }
    this.method = input.method;
    this.mode = input.mode;
    this.signal = input.signal;
    if (!body && input._bodyInit != null) {
      body = input._bodyInit;
      input.bodyUsed = true;
    }
  } else {
    this.url = String(input);
  }
  this.credentials = options.credentials || this.credentials || "same-origin";
  if (options.headers || !this.headers) {
    this.headers = new Headers(options.headers);
  }
  this.method = normalizeMethod(options.method || this.method || "GET");
  this.mode = options.mode || this.mode || null;
  this.signal = options.signal || this.signal || function() {
    if ("AbortController" in g) {
      var ctrl = new AbortController();
      return ctrl.signal;
    }
  }();
  this.referrer = null;
  if ((this.method === "GET" || this.method === "HEAD") && body) {
    throw new TypeError("Body not allowed for GET or HEAD requests");
  }
  this._initBody(body);
  if (this.method === "GET" || this.method === "HEAD") {
    if (options.cache === "no-store" || options.cache === "no-cache") {
      var reParamSearch = /([?&])_=[^&]*/;
      if (reParamSearch.test(this.url)) {
        this.url = this.url.replace(reParamSearch, "$1_=" + (/* @__PURE__ */ new Date()).getTime());
      } else {
        var reQueryString = /\?/;
        this.url += (reQueryString.test(this.url) ? "&" : "?") + "_=" + (/* @__PURE__ */ new Date()).getTime();
      }
    }
  }
}
Request.prototype.clone = function() {
  return new Request(this, { body: this._bodyInit });
};
function decode(body) {
  var form = new FormData();
  body.trim().split("&").forEach(function(bytes) {
    if (bytes) {
      var split = bytes.split("=");
      var name = split.shift().replace(/\+/g, " ");
      var value = split.join("=").replace(/\+/g, " ");
      form.append(decodeURIComponent(name), decodeURIComponent(value));
    }
  });
  return form;
}
function parseHeaders(rawHeaders) {
  var headers = new Headers();
  var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, " ");
  preProcessedHeaders.split("\r").map(function(header) {
    return header.indexOf("\n") === 0 ? header.substr(1, header.length) : header;
  }).forEach(function(line) {
    var parts = line.split(":");
    var key = parts.shift().trim();
    if (key) {
      var value = parts.join(":").trim();
      try {
        headers.append(key, value);
      } catch (error) {
        console.warn("Response " + error.message);
      }
    }
  });
  return headers;
}
Body.call(Request.prototype);
function Response(bodyInit, options) {
  if (!(this instanceof Response)) {
    throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
  }
  if (!options) {
    options = {};
  }
  this.type = "default";
  this.status = options.status === void 0 ? 200 : options.status;
  if (this.status < 200 || this.status > 599) {
    throw new RangeError("Failed to construct 'Response': The status provided (0) is outside the range [200, 599].");
  }
  this.ok = this.status >= 200 && this.status < 300;
  this.statusText = options.statusText === void 0 ? "" : "" + options.statusText;
  this.headers = new Headers(options.headers);
  this.url = options.url || "";
  this._initBody(bodyInit);
}
Body.call(Response.prototype);
Response.prototype.clone = function() {
  return new Response(this._bodyInit, {
    status: this.status,
    statusText: this.statusText,
    headers: new Headers(this.headers),
    url: this.url
  });
};
Response.error = function() {
  var response = new Response(null, { status: 200, statusText: "" });
  response.ok = false;
  response.status = 0;
  response.type = "error";
  return response;
};
var redirectStatuses = [301, 302, 303, 307, 308];
Response.redirect = function(url, status) {
  if (redirectStatuses.indexOf(status) === -1) {
    throw new RangeError("Invalid status code");
  }
  return new Response(null, { status, headers: { location: url } });
};
var DOMException = g.DOMException;
try {
  new DOMException();
} catch (err) {
  DOMException = function(message, name) {
    this.message = message;
    this.name = name;
    var error = Error(message);
    this.stack = error.stack;
  };
  DOMException.prototype = Object.create(Error.prototype);
  DOMException.prototype.constructor = DOMException;
}
function fetch$1(input, init) {
  return new Promise(function(resolve2, reject) {
    var request = new Request(input, init);
    if (request.signal && request.signal.aborted) {
      return reject(new DOMException("Aborted", "AbortError"));
    }
    var xhr = new XMLHttpRequest();
    function abortXhr() {
      xhr.abort();
    }
    xhr.onload = function() {
      var options = {
        statusText: xhr.statusText,
        headers: parseHeaders(xhr.getAllResponseHeaders() || "")
      };
      if (request.url.indexOf("file://") === 0 && (xhr.status < 200 || xhr.status > 599)) {
        options.status = 200;
      } else {
        options.status = xhr.status;
      }
      options.url = "responseURL" in xhr ? xhr.responseURL : options.headers.get("X-Request-URL");
      var body = "response" in xhr ? xhr.response : xhr.responseText;
      setTimeout(function() {
        resolve2(new Response(body, options));
      }, 0);
    };
    xhr.onerror = function() {
      setTimeout(function() {
        reject(new TypeError("Network request failed"));
      }, 0);
    };
    xhr.ontimeout = function() {
      setTimeout(function() {
        reject(new TypeError("Network request timed out"));
      }, 0);
    };
    xhr.onabort = function() {
      setTimeout(function() {
        reject(new DOMException("Aborted", "AbortError"));
      }, 0);
    };
    function fixUrl(url) {
      try {
        return url === "" && g.location.href ? g.location.href : url;
      } catch (e) {
        return url;
      }
    }
    xhr.open(request.method, fixUrl(request.url), true);
    if (request.credentials === "include") {
      xhr.withCredentials = true;
    } else if (request.credentials === "omit") {
      xhr.withCredentials = false;
    }
    if ("responseType" in xhr) {
      if (support.blob) {
        xhr.responseType = "blob";
      } else if (support.arrayBuffer) {
        xhr.responseType = "arraybuffer";
      }
    }
    if (init && typeof init.headers === "object" && !(init.headers instanceof Headers || g.Headers && init.headers instanceof g.Headers)) {
      var names = [];
      Object.getOwnPropertyNames(init.headers).forEach(function(name) {
        names.push(normalizeName(name));
        xhr.setRequestHeader(name, normalizeValue(init.headers[name]));
      });
      request.headers.forEach(function(value, name) {
        if (names.indexOf(name) === -1) {
          xhr.setRequestHeader(name, value);
        }
      });
    } else {
      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value);
      });
    }
    if (request.signal) {
      request.signal.addEventListener("abort", abortXhr);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          request.signal.removeEventListener("abort", abortXhr);
        }
      };
    }
    xhr.send(typeof request._bodyInit === "undefined" ? null : request._bodyInit);
  });
}
fetch$1.polyfill = true;
if (!g.fetch) {
  g.fetch = fetch$1;
  g.Headers = Headers;
  g.Request = Request;
  g.Response = Response;
}
const version = "0.5.13";
const defaultPort = "11434";
const defaultHost = `http://127.0.0.1:${defaultPort}`;
var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => {
  __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class ResponseError extends Error {
  constructor(error, status_code) {
    super(error);
    this.error = error;
    this.status_code = status_code;
    this.name = "ResponseError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ResponseError);
    }
  }
}
class AbortableAsyncIterator {
  constructor(abortController, itr, doneCallback) {
    __publicField$1(this, "abortController");
    __publicField$1(this, "itr");
    __publicField$1(this, "doneCallback");
    this.abortController = abortController;
    this.itr = itr;
    this.doneCallback = doneCallback;
  }
  abort() {
    this.abortController.abort();
  }
  async *[Symbol.asyncIterator]() {
    for await (const message of this.itr) {
      if ("error" in message) {
        throw new Error(message.error);
      }
      yield message;
      if (message.done || message.status === "success") {
        this.doneCallback();
        return;
      }
    }
    throw new Error("Did not receive done or success response in stream.");
  }
}
const checkOk = async (response) => {
  var _a;
  if (response.ok) {
    return;
  }
  let message = `Error ${response.status}: ${response.statusText}`;
  let errorData = null;
  if ((_a = response.headers.get("content-type")) == null ? void 0 : _a.includes("application/json")) {
    try {
      errorData = await response.json();
      message = errorData.error || message;
    } catch (error) {
      console.log("Failed to parse error response as JSON");
    }
  } else {
    try {
      console.log("Getting text from response");
      const textResponse = await response.text();
      message = textResponse || message;
    } catch (error) {
      console.log("Failed to get text from error response");
    }
  }
  throw new ResponseError(message, response.status);
};
function getPlatform() {
  if (typeof window !== "undefined" && window.navigator) {
    return `${window.navigator.platform.toLowerCase()} Browser/${navigator.userAgent};`;
  } else if (typeof process !== "undefined") {
    return `${process.arch} ${process.platform} Node.js/${process.version}`;
  }
  return "";
}
const fetchWithHeaders = async (fetch2, url, options = {}) => {
  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": `ollama-js/${version} (${getPlatform()})`
  };
  if (!options.headers) {
    options.headers = {};
  }
  const customHeaders = Object.fromEntries(
    Object.entries(options.headers).filter(([key]) => !Object.keys(defaultHeaders).some((defaultKey) => defaultKey.toLowerCase() === key.toLowerCase()))
  );
  options.headers = {
    ...defaultHeaders,
    ...customHeaders
  };
  return fetch2(url, options);
};
const get = async (fetch2, host, options) => {
  const response = await fetchWithHeaders(fetch2, host, {
    headers: options == null ? void 0 : options.headers
  });
  await checkOk(response);
  return response;
};
const post = async (fetch2, host, data, options) => {
  const isRecord = (input) => {
    return input !== null && typeof input === "object" && !Array.isArray(input);
  };
  const formattedData = isRecord(data) ? JSON.stringify(data) : data;
  const response = await fetchWithHeaders(fetch2, host, {
    method: "POST",
    body: formattedData,
    signal: options == null ? void 0 : options.signal,
    headers: options == null ? void 0 : options.headers
  });
  await checkOk(response);
  return response;
};
const del = async (fetch2, host, data, options) => {
  const response = await fetchWithHeaders(fetch2, host, {
    method: "DELETE",
    body: JSON.stringify(data),
    headers: options == null ? void 0 : options.headers
  });
  await checkOk(response);
  return response;
};
const parseJSON = async function* (itr) {
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  const reader = itr.getReader();
  while (true) {
    const { done, value: chunk } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(chunk);
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      try {
        yield JSON.parse(part);
      } catch (error) {
        console.warn("invalid json: ", part);
      }
    }
  }
  for (const part of buffer.split("\n").filter((p) => p !== "")) {
    try {
      yield JSON.parse(part);
    } catch (error) {
      console.warn("invalid json: ", part);
    }
  }
};
const formatHost = (host) => {
  if (!host) {
    return defaultHost;
  }
  let isExplicitProtocol = host.includes("://");
  if (host.startsWith(":")) {
    host = `http://127.0.0.1${host}`;
    isExplicitProtocol = true;
  }
  if (!isExplicitProtocol) {
    host = `http://${host}`;
  }
  const url = new URL(host);
  let port = url.port;
  if (!port) {
    if (!isExplicitProtocol) {
      port = defaultPort;
    } else {
      port = url.protocol === "https:" ? "443" : "80";
    }
  }
  let formattedHost = `${url.protocol}//${url.hostname}:${port}${url.pathname}`;
  if (formattedHost.endsWith("/")) {
    formattedHost = formattedHost.slice(0, -1);
  }
  return formattedHost;
};
var __defProp2 = Object.defineProperty;
var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField2 = (obj, key, value) => {
  __defNormalProp2(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
let Ollama$1 = class Ollama {
  constructor(config) {
    __publicField2(this, "config");
    __publicField2(this, "fetch");
    __publicField2(this, "ongoingStreamedRequests", []);
    this.config = {
      host: "",
      headers: config == null ? void 0 : config.headers
    };
    if (!(config == null ? void 0 : config.proxy)) {
      this.config.host = formatHost((config == null ? void 0 : config.host) ?? defaultHost);
    }
    this.fetch = (config == null ? void 0 : config.fetch) ?? fetch;
  }
  // Abort any ongoing streamed requests to Ollama
  abort() {
    for (const request of this.ongoingStreamedRequests) {
      request.abort();
    }
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
  async processStreamableRequest(endpoint, request) {
    request.stream = request.stream ?? false;
    const host = `${this.config.host}/api/${endpoint}`;
    if (request.stream) {
      const abortController = new AbortController();
      const response2 = await post(this.fetch, host, request, {
        signal: abortController.signal,
        headers: this.config.headers
      });
      if (!response2.body) {
        throw new Error("Missing body");
      }
      const itr = parseJSON(response2.body);
      const abortableAsyncIterator = new AbortableAsyncIterator(
        abortController,
        itr,
        () => {
          const i = this.ongoingStreamedRequests.indexOf(abortableAsyncIterator);
          if (i > -1) {
            this.ongoingStreamedRequests.splice(i, 1);
          }
        }
      );
      this.ongoingStreamedRequests.push(abortableAsyncIterator);
      return abortableAsyncIterator;
    }
    const response = await post(this.fetch, host, request, {
      headers: this.config.headers
    });
    return await response.json();
  }
  /**
   * Encodes an image to base64 if it is a Uint8Array.
   * @param image {Uint8Array | string} - The image to encode.
   * @returns {Promise<string>} - The base64 encoded image.
   */
  async encodeImage(image) {
    if (typeof image !== "string") {
      const uint8Array = new Uint8Array(image);
      let byteString = "";
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
        byteString += String.fromCharCode(uint8Array[i]);
      }
      return btoa(byteString);
    }
    return image;
  }
  /**
   * Generates a response from a text prompt.
   * @param request {GenerateRequest} - The request object.
   * @returns {Promise<GenerateResponse | AbortableAsyncIterator<GenerateResponse>>} - The response object or
   * an AbortableAsyncIterator that yields response messages.
   */
  async generate(request) {
    if (request.images) {
      request.images = await Promise.all(request.images.map(this.encodeImage.bind(this)));
    }
    return this.processStreamableRequest("generate", request);
  }
  /**
   * Chats with the model. The request object can contain messages with images that are either
   * Uint8Arrays or base64 encoded strings. The images will be base64 encoded before sending the
   * request.
   * @param request {ChatRequest} - The request object.
   * @returns {Promise<ChatResponse | AbortableAsyncIterator<ChatResponse>>} - The response object or an
   * AbortableAsyncIterator that yields response messages.
   */
  async chat(request) {
    if (request.messages) {
      for (const message of request.messages) {
        if (message.images) {
          message.images = await Promise.all(
            message.images.map(this.encodeImage.bind(this))
          );
        }
      }
    }
    return this.processStreamableRequest("chat", request);
  }
  /**
   * Creates a new model from a stream of data.
   * @param request {CreateRequest} - The request object.
   * @returns {Promise<ProgressResponse | AbortableAsyncIterator<ProgressResponse>>} - The response object or a stream of progress responses.
   */
  async create(request) {
    return this.processStreamableRequest("create", {
      ...request
    });
  }
  /**
   * Pulls a model from the Ollama registry. The request object can contain a stream flag to indicate if the
   * response should be streamed.
   * @param request {PullRequest} - The request object.
   * @returns {Promise<ProgressResponse | AbortableAsyncIterator<ProgressResponse>>} - The response object or
   * an AbortableAsyncIterator that yields response messages.
   */
  async pull(request) {
    return this.processStreamableRequest("pull", {
      name: request.model,
      stream: request.stream,
      insecure: request.insecure
    });
  }
  /**
   * Pushes a model to the Ollama registry. The request object can contain a stream flag to indicate if the
   * response should be streamed.
   * @param request {PushRequest} - The request object.
   * @returns {Promise<ProgressResponse | AbortableAsyncIterator<ProgressResponse>>} - The response object or
   * an AbortableAsyncIterator that yields response messages.
   */
  async push(request) {
    return this.processStreamableRequest("push", {
      name: request.model,
      stream: request.stream,
      insecure: request.insecure
    });
  }
  /**
   * Deletes a model from the server. The request object should contain the name of the model to
   * delete.
   * @param request {DeleteRequest} - The request object.
   * @returns {Promise<StatusResponse>} - The response object.
   */
  async delete(request) {
    await del(
      this.fetch,
      `${this.config.host}/api/delete`,
      { name: request.model },
      { headers: this.config.headers }
    );
    return { status: "success" };
  }
  /**
   * Copies a model from one name to another. The request object should contain the name of the
   * model to copy and the new name.
   * @param request {CopyRequest} - The request object.
   * @returns {Promise<StatusResponse>} - The response object.
   */
  async copy(request) {
    await post(this.fetch, `${this.config.host}/api/copy`, { ...request }, {
      headers: this.config.headers
    });
    return { status: "success" };
  }
  /**
   * Lists the models on the server.
   * @returns {Promise<ListResponse>} - The response object.
   * @throws {Error} - If the response body is missing.
   */
  async list() {
    const response = await get(this.fetch, `${this.config.host}/api/tags`, {
      headers: this.config.headers
    });
    return await response.json();
  }
  /**
   * Shows the metadata of a model. The request object should contain the name of the model.
   * @param request {ShowRequest} - The request object.
   * @returns {Promise<ShowResponse>} - The response object.
   */
  async show(request) {
    const response = await post(this.fetch, `${this.config.host}/api/show`, {
      ...request
    }, {
      headers: this.config.headers
    });
    return await response.json();
  }
  /**
   * Embeds text input into vectors.
   * @param request {EmbedRequest} - The request object.
   * @returns {Promise<EmbedResponse>} - The response object.
   */
  async embed(request) {
    const response = await post(this.fetch, `${this.config.host}/api/embed`, {
      ...request
    }, {
      headers: this.config.headers
    });
    return await response.json();
  }
  /**
   * Embeds a text prompt into a vector.
   * @param request {EmbeddingsRequest} - The request object.
   * @returns {Promise<EmbeddingsResponse>} - The response object.
   */
  async embeddings(request) {
    const response = await post(this.fetch, `${this.config.host}/api/embeddings`, {
      ...request
    }, {
      headers: this.config.headers
    });
    return await response.json();
  }
  /**
   * Lists the running models on the server
   * @returns {Promise<ListResponse>} - The response object.
   * @throws {Error} - If the response body is missing.
   */
  async ps() {
    const response = await get(this.fetch, `${this.config.host}/api/ps`, {
      headers: this.config.headers
    });
    return await response.json();
  }
};
new Ollama$1();
class Ollama2 extends Ollama$1 {
  async encodeImage(image) {
    if (typeof image !== "string") {
      return Buffer.from(image).toString("base64");
    }
    try {
      if (fs$1.existsSync(image)) {
        const fileBuffer = await promises.readFile(resolve(image));
        return Buffer.from(fileBuffer).toString("base64");
      }
    } catch {
    }
    return image;
  }
  /**
   * checks if a file exists
   * @param path {string} - The path to the file
   * @private @internal
   * @returns {Promise<boolean>} - Whether the file exists or not
   */
  async fileExists(path2) {
    try {
      await promises.access(path2);
      return true;
    } catch {
      return false;
    }
  }
  async create(request) {
    if (request.from && await this.fileExists(resolve(request.from))) {
      throw Error("Creating with a local path is not currently supported from ollama-js");
    }
    if (request.stream) {
      return super.create(request);
    } else {
      return super.create(request);
    }
  }
}
const index = new Ollama2();
class Assistant {
  constructor() {
    __publicField(this, "memory_system_prompt");
    __publicField(this, "chat_system_prompt");
    __publicField(this, "tools");
    this.memory_system_prompt = `You are a memory system.
          When users share important information:
          - Extract key facts and keywords
          - Use session:note to store this information
          - Store only keywords and key facts
          When users ask questions:
          - Use session:query to retrieve relevant memories
          - Respond with accurate, previously stored information
          - Use only keywords to search for relevant memories
          - If the question is specific, set smaller nResult (5-10), otherwise set larger nResult (20-50)
          Be selective - only store truly important information.`;
    this.chat_system_prompt = `These are the results of querying past memories and the database based on the question.
        Please use these additional context to find useful information and respond to the user accurately.`;
    this.tools = [
      {
        type: "function",
        function: {
          name: "session:note",
          description: "Note the conversation",
          parameters: {
            type: "object",
            properties: {
              keywords: {
                type: "string",
                description: "The keywords to remember"
              }
            },
            required: ["keywords"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "session:query",
          description: "Query the conversation memory",
          parameters: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "keywords to retrieve data from embedded memory"
              },
              nResults: {
                type: "number",
                description: "number of results to return"
              }
            },
            required: ["content", "nResults"]
          }
        }
      }
    ];
  }
  async call_apis(prompt) {
    const response = await index.chat({
      model: prompt.model ? prompt.model : "llama3.1",
      messages: [
        { role: "system", content: this.memory_system_prompt },
        { role: "user", content: prompt.content }
      ],
      tools: this.tools
    });
    return response.message;
  }
  async chat(prompt, extra_context, event) {
    console.log(prompt.content, extra_context);
    const response = await index.chat({
      model: prompt.model ? prompt.model : "llama3.1",
      messages: [
        { role: "system", content: this.chat_system_prompt },
        { role: "user", content: `### User Prompt:
${prompt.content}

### Additional Context:
${extra_context}

` }
      ],
      stream: true
    });
    for await (const part of response) {
      event.sender.send("llm:stream", part.message.content);
    }
  }
}
const require$1 = createRequire(import.meta.url);
const Docker = require$1("dockerode");
const docker = new Docker();
const __root__$1 = process.env.HOME || process.env.USERPROFILE;
const __dir__$1 = path.join(__root__$1 || "/", ".research.go", "users");
const images = [
  { name: "robwilkes/unstructured-api", port: "5051", internalPort: "8000" },
  { name: "chromadb/chroma", port: "5050", internalPort: "8000" }
];
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
async function pullImageIfNotExists(imageName) {
  try {
    const image = docker.getImage(imageName);
    await image.inspect();
    console.log(`${imageName} already exists.`);
  } catch (error) {
    console.log(`${imageName} not found, pulling...`);
    await docker.pull(imageName);
    console.log(`${imageName} pulled successfully.`);
  }
}
async function runContainer(imageName, port, internalPort, volumeName, envs) {
  const containerConfig = {
    Image: imageName,
    Env: envs ? envs : [],
    HostConfig: {
      PortBindings: {
        [`${internalPort}/tcp`]: [{ HostPort: port }]
      },
      Binds: volumeName ? [volumeName] : [],
      AutoRemove: true
    }
  };
  const container = await docker.createContainer(containerConfig);
  await container.start();
  console.log(`${imageName} container started and port ${port} mapped to host.`);
  return container;
}
async function stopAndRemoveContainers(containers) {
  for (let container of containers) {
    await container.stop();
    console.log(`Container stopped.`);
  }
}
async function launchDockerContainers(user) {
  const userDir = path.join(__dir__$1, user.name);
  const indexDir = path.join(userDir, "index");
  console.log(`volume: ${indexDir}`);
  ensureDirectoryExists(indexDir);
  try {
    await Promise.all(images.map((image) => pullImageIfNotExists(image.name)));
    const unstructuredContainer = await runContainer("robwilkes/unstructured-api", "5051", "8000");
    const chromadbContainer = await runContainer("chromadb/chroma", "5050", "8000", `${indexDir}:/chroma/chroma:rw`, ['CHROMA_SERVER_CORS_ALLOW_ORIGINS=["http://localhost:*"]']);
    return [unstructuredContainer, chromadbContainer];
  } catch (error) {
    console.error("Error during docker operations: ", error);
    throw error;
  }
}
const require2 = createRequire(import.meta.url);
const { ChromaClient, OllamaEmbeddingFunction } = require2("chromadb");
class EmbeddedClient {
  constructor() {
    __publicField(this, "client");
    __publicField(this, "embeddingFunc");
    __publicField(this, "session_history");
    __publicField(this, "pdf_db");
    this.client = new ChromaClient({ path: "http://localhost:5050" });
    this.embeddingFunc = new OllamaEmbeddingFunction({
      url: "http://localhost:11434/api/embeddings",
      model: "mxbai-embed-large"
    });
    this.session_history = null;
    this.pdf_db = null;
  }
  async connect() {
    if (this.client) return;
    await new Promise((resolve2) => setTimeout(resolve2, 1e3));
    await this.connect();
  }
  async getClient() {
    await this.connect();
    return this.client;
  }
  async getSessionHistory(session_name) {
    this.session_history = await (await this.getClient()).getOrCreateCollection({
      name: session_name,
      embeddingFunction: this.embeddingFunc
    });
  }
  async addSessionHistory(documents, ids, user) {
    if (this.session_history) {
      const embeddings = await this.embeddingFunc.generate(documents);
      await this.session_history.add({
        ids,
        documents,
        embeddings,
        metadatas: [{ user }]
      });
      return true;
    } else return false;
  }
  async querySessionHistory(prompt, nResults, user) {
    if (this.session_history) {
      const queryEmbedding = await this.embeddingFunc.generate([prompt]);
      const results = await this.session_history.query({
        nResults,
        queryEmbeddings: queryEmbedding,
        where: { user }
      });
      return results;
    } else return [];
  }
  async getPdfDataBase() {
    this.pdf_db = await this.client.getOrCreateCollection({
      name: "pdf",
      embeddingFunction: this.embeddingFunc
    });
  }
  async addPdfData(documents, ids, metas = null) {
    if (this.pdf_db) {
      const embeddings = await this.embeddingFunc.generate(documents);
      await this.pdf_db.add({
        ids,
        documents,
        embeddings
        // metadatas: metas? metas: {},
      });
      return true;
    } else return false;
  }
  async queryPdfSegment(prompt, nResults, metas = null) {
    if (this.pdf_db) {
      const queryEmbedding = await this.embeddingFunc.generate([prompt]);
      const results = await this.pdf_db.query({
        nResults,
        queryEmbeddings: queryEmbedding
        // where: metas? metas: {},
      });
      return results;
    } else return [];
  }
  isValid() {
    return this.pdf_db !== null && this.session_history !== null;
  }
}
const urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const POOL_SIZE_MULTIPLIER = 128;
let pool, poolOffset;
function fillPool(bytes) {
  if (!pool || pool.length < bytes) {
    pool = Buffer.allocUnsafe(bytes * POOL_SIZE_MULTIPLIER);
    webcrypto.getRandomValues(pool);
    poolOffset = 0;
  } else if (poolOffset + bytes > pool.length) {
    webcrypto.getRandomValues(pool);
    poolOffset = 0;
  }
  poolOffset += bytes;
}
function nanoid(size = 21) {
  fillPool(size |= 0);
  let id = "";
  for (let i = poolOffset - size; i < poolOffset; i++) {
    id += urlAlphabet[pool[i] & 63];
  }
  return id;
}
createRequire(import.meta.url);
const __dirname = path$1.dirname(fileURLToPath(import.meta.url));
const __root__ = process.env.HOME || process.env.USERPROFILE;
const __dir__ = path$1.join(__root__ || "/", ".research.go", "users");
process.env.APP_ROOT = path$1.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let embedding_client = null;
let assistant = new Assistant();
function createWindow() {
  win = new BrowserWindow({
    icon: path$1.join(process.env.VITE_PUBLIC, "logo.png"),
    webPreferences: {
      preload: path$1.join(__dirname, "preload.mjs")
    }
  });
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    let headers = details.responseHeaders;
    if (!headers) {
      console.error("Response without header");
      return;
    }
    if (details.url.includes("localhost")) {
      headers["Access-Control-Allow-Origin"] = ["*"];
      headers["Access-Control-Allow-Headers"] = ["*"];
      headers["Access-Control-Allow-Methods"] = ["GET, POST, PUT, DELETE"];
    }
    callback({ responseHeaders: headers });
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$1.join(RENDERER_DIST, "index.html"));
  }
}
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
ipcMain.handle("file:open-dialog", async () => {
  if (win) {
    const result = await dialog.showOpenDialog(win, {
      title: "Choose file",
      buttonLabel: "Open",
      properties: ["openFile"],
      filters: [{ name: "Document", extensions: ["pdf"] }]
    });
    if (result.canceled) {
      return null;
    }
    return result.filePaths.length > 0 ? result.filePaths[0] : null;
  } else {
    return null;
  }
});
ipcMain.handle("file:read", (event, filename) => {
  if (win) {
    const data = fs.readFileSync(filename);
    return data;
  } else {
    return null;
  }
});
ipcMain.handle("user:register", (event, user) => {
  if (win) {
    return registerUser(user.name, user.password);
  } else {
    return false;
  }
});
ipcMain.handle("user:validate", (event, user) => {
  if (win) {
    return validateUser(user.name, user.password);
  } else {
    return false;
  }
});
ipcMain.handle("llm:prompt", async (event, prompt) => {
  if (win) {
    const messages = await assistant.call_apis(prompt);
    var memory = null;
    if (messages.tool_calls) {
      for (const tool of messages.tool_calls) {
        if (tool.function.name === "session:note") {
          if (embedding_client == null ? void 0 : embedding_client.isValid()) {
            await embedding_client.addSessionHistory([tool.function.arguments.keywords], [nanoid()], prompt.user);
          } else {
            console.error("Conversation is not memorized");
          }
        } else if (tool.function.name === "session:query") {
          const query = { content: tool.function.arguments.content, nResults: tool.function.arguments.nResults, user: prompt.user };
          if (embedding_client == null ? void 0 : embedding_client.isValid()) {
            memory = await embedding_client.querySessionHistory(query.content, query.nResults, query.user);
          } else {
            console.error("Cannot query converation history");
            return;
          }
        }
      }
    }
    console.log(memory);
    await assistant.chat(prompt, memory == null ? void 0 : memory.documents[0][0], event);
  } else {
    return;
  }
});
ipcMain.handle("docker:launch", async (event, user_info) => {
  if (win) {
    try {
      const containers = await launchDockerContainers(user_info);
      app.on("window-all-closed", async () => {
        await stopAndRemoveContainers(containers);
        app.quit();
        win = null;
      });
      return true;
    } catch (error) {
      return false;
    }
  } else {
    return false;
  }
});
ipcMain.handle("session:create", async (event, session_name) => {
  if (win) {
    embedding_client = new EmbeddedClient();
    await embedding_client.getSessionHistory(session_name);
    await embedding_client.getPdfDataBase();
    var success = embedding_client.isValid();
    return success;
  } else {
    return false;
  }
});
ipcMain.handle("session:note", async (event, message) => {
  if (win) {
    if (embedding_client == null ? void 0 : embedding_client.isValid()) {
      await embedding_client.addSessionHistory(message.prompts, message.ids, message.user);
    } else {
      console.error("Conversation is not memorized");
    }
  } else {
    console.error("Conversation is not memorized");
  }
});
ipcMain.handle("session:query", async (event, query) => {
  if (win) {
    if (embedding_client == null ? void 0 : embedding_client.isValid()) {
      const results = await embedding_client.querySessionHistory(query.content, query.nResults, query.user);
      return results;
    } else {
      console.error("Cannot query converation history");
      return [];
    }
  } else {
    console.error("Cannot query converation history");
    return [];
  }
});
ipcMain.handle("knowledge:note", async (event, knowledge) => {
  if (win) {
    if (embedding_client == null ? void 0 : embedding_client.isValid()) {
      await embedding_client.addPdfData(knowledge.data, knowledge.ids, knowledge.meta);
    } else {
      console.error("Knowledge is not memorized");
    }
  } else {
    console.error("Knowledge is not memorized");
  }
});
ipcMain.handle("knowledge:query", async (event, query) => {
  if (win) {
    if (embedding_client == null ? void 0 : embedding_client.isValid()) {
      const results = await embedding_client.queryPdfSegment(query.content, query.nResults, query.meta);
      return results;
    } else {
      console.error("Cannot query pre-knowledge");
      return [];
    }
  } else {
    console.error("Cannot query pre-knowledge");
    return [];
  }
});
ipcMain.handle("chat:get-rooms", (event, user_name) => {
  if (win) {
    const sessionsFilePath = path$1.join(__dir__, user_name, "sessions.json");
    if (!fs.existsSync(sessionsFilePath)) {
      fs.writeFileSync(sessionsFilePath, JSON.stringify([], null, 2), "utf-8");
    }
    const sessions = JSON.parse(fs.readFileSync(sessionsFilePath, "utf-8"));
    return sessions;
  } else {
    return [];
  }
});
ipcMain.handle("chat:get-or-create", (event, user_name, session_id, title) => {
  if (win) {
    const sessionPath = path$1.join(__dir__, user_name, `.${session_id}`);
    const historyFilePath = path$1.join(sessionPath, "history.json");
    const sessionsFilePath = path$1.join(__dir__, user_name, "sessions.json");
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
      fs.writeFileSync(historyFilePath, JSON.stringify({ title, messages: [] }));
    }
    const history = JSON.parse(fs.readFileSync(historyFilePath, "utf-8"));
    const sessions = JSON.parse(fs.readFileSync(sessionsFilePath, "utf-8"));
    const sessionIndex = sessions.findIndex((s) => s.id === session_id);
    if (sessionIndex === -1) {
      sessions.push({ title, id: session_id });
      fs.writeFileSync(sessionsFilePath, JSON.stringify(sessions, null, 2), "utf-8");
    }
    return history;
  }
  return { title, messages: [] };
});
ipcMain.handle("chat:history", (event, user_name, session_id, content) => {
  if (win) {
    const sessionPath = path$1.join(__dir__, user_name, `.${session_id}`);
    const historyFilePath = path$1.join(sessionPath, "history.json");
    if (!fs.existsSync(sessionPath)) {
      return;
    }
    const history = JSON.parse(fs.readFileSync(historyFilePath, "utf-8"));
    history["messages"].push(content);
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2), "utf-8");
  }
});
ipcMain.handle("chat:set-title", (event, user_name, session_id, title) => {
  if (win) {
    const sessionPath = path$1.join(__dir__, user_name, `.${session_id}`);
    const historyFilePath = path$1.join(sessionPath, "history.json");
    const sessionsFilePath = path$1.join(__dir__, user_name, "sessions.json");
    if (!fs.existsSync(sessionPath) || !fs.existsSync(historyFilePath) || !fs.existsSync(sessionsFilePath)) {
      return false;
    }
    const history = JSON.parse(fs.readFileSync(historyFilePath, "utf-8"));
    history.title = title;
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2), "utf-8");
    const sessions = JSON.parse(fs.readFileSync(sessionsFilePath, "utf-8"));
    const sessionIndex = sessions.findIndex((s) => s.id === session_id);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].title = title;
      fs.writeFileSync(sessionsFilePath, JSON.stringify(sessions, null, 2), "utf-8");
      return true;
    }
    return false;
  }
  return false;
});
ipcMain.handle("chat:delete", (event, user_name, session_id) => {
  if (win) {
    const sessionPath = path$1.join(__dir__, user_name, `.${session_id}`);
    const sessionsFilePath = path$1.join(__dir__, user_name, "sessions.json");
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
    if (fs.existsSync(sessionsFilePath)) {
      const sessions = JSON.parse(fs.readFileSync(sessionsFilePath, "utf-8"));
      const updatedSessions = sessions.filter((session) => session.id !== session_id);
      fs.writeFileSync(sessionsFilePath, JSON.stringify(updatedSessions, null, 2), "utf-8");
    }
  }
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
