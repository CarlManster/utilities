var Settings = (function () {
  var COOKIE = 'utilities_setting';
  var DB_NAME = 'utilities_keystore';
  var DB_VERSION = 1;
  var DB_STORE = 'keys';
  var DB_KEY_ID = 'master';

  var _data = {
    lang: 'en', defaultpage: null, lastpage: '',
    dayInfo: {}, dice: {}, colorpicker: {}, jsonvisualizer: {},
    repayment: { principal: 100000000, period: 120, holding: 0, interest: 3.0 }
  };
  var _key = null;
  var _useCrypto = !!(window.crypto && window.crypto.subtle && window.indexedDB);
  var _readyResolve;
  var _ready = new Promise(function (r) { _readyResolve = r; });

  /* -- Cookie helpers -- */
  function readCookie(name) {
    var m = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[2]) : '';
  }
  function writeCookie(name, val) {
    var d = new Date(); d.setFullYear(d.getFullYear() + 5);
    document.cookie = name + '=' + encodeURIComponent(val) + ';expires=' + d.toUTCString() + ';path=/';
  }
  function deleteCookie(name) {
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
  }

  /* -- IndexedDB-backed CryptoKey -- */
  // The AES-GCM key is generated once with extractable:false and persisted as a
  // CryptoKey object in IndexedDB. The raw bytes never leave the browser, so the
  // settings cookie can only be decrypted by code running in this origin.
  function openDB() {
    return new Promise(function (resolve, reject) {
      var req;
      try { req = indexedDB.open(DB_NAME, DB_VERSION); }
      catch (e) { reject(e); return; }
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
      req.onblocked = function () { reject(new Error('idb blocked')); };
    });
  }

  function idbGet(db, id) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(DB_STORE, 'readonly');
      var req = tx.objectStore(DB_STORE).get(id);
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function idbPut(db, id, value) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put(value, id);
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
      tx.onabort = function () { reject(tx.error); };
    });
  }

  function loadOrCreateKey() {
    if (!_useCrypto) return Promise.resolve(null);
    return openDB().then(function (db) {
      return idbGet(db, DB_KEY_ID).then(function (existing) {
        if (existing) return existing;
        return crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        ).then(function (key) {
          return idbPut(db, DB_KEY_ID, key).then(function () { return key; });
        });
      });
    }).catch(function () { return null; });
  }

  /* -- Crypto helpers -- */
  function encrypt(text) {
    if (!_useCrypto || !_key) return Promise.resolve(btoa(unescape(encodeURIComponent(text))));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, _key, new TextEncoder().encode(text))
      .then(function (enc) {
        var buf = new Uint8Array(iv.length + enc.byteLength);
        buf.set(iv); buf.set(new Uint8Array(enc), iv.length);
        return btoa(String.fromCharCode.apply(null, buf));
      });
  }

  function decrypt(b64) {
    if (!_useCrypto || !_key) {
      try { return Promise.resolve(decodeURIComponent(escape(atob(b64)))); }
      catch (e) { return Promise.resolve(null); }
    }
    try {
      var raw = Uint8Array.from(atob(b64), function (c) { return c.charCodeAt(0); });
      var iv = raw.slice(0, 12), ct = raw.slice(12);
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, _key, ct)
        .then(function (dec) { return new TextDecoder().decode(dec); })
        .catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }

  /* -- Migration from old cookies -- */
  function migrateOld() {
    var lang = readCookie('utilities_lang');
    var page = readCookie('utilities_page');
    var apikey = readCookie('dayinfo_key');
    if (lang) _data.lang = lang;
    if (page) _data.lastpage = page;
    if (apikey) _data.dayInfo.apikey = apikey;
    if (lang || page || apikey) {
      deleteCookie('utilities_lang');
      deleteCookie('utilities_page');
      deleteCookie('dayinfo_key');
      return true;
    }
    return false;
  }

  /* -- Init -- */
  function init() {
    return loadOrCreateKey().then(function (key) {
      _key = key;
      if (!_key) _useCrypto = false;

      var cookieVal = readCookie(COOKIE);
      if (cookieVal) {
        return decrypt(cookieVal).then(function (json) {
          if (json) {
            try {
              var p = JSON.parse(json);
              Object.keys(p).forEach(function (k) { _data[k] = p[k]; });
            } catch (e) {}
          }
        });
      } else {
        if (migrateOld()) return save();
      }
    }).then(function () {
      try {
        var params = new URLSearchParams(location.search);
        var urlLang = params.get('lang');
        var urlTheme = params.get('theme');
        if (urlLang) _data.lang = urlLang;
        if (urlTheme) _data.screenmode = urlTheme;
      } catch (e) {}

      if (typeof I18N !== 'undefined' && I18N.setLang) {
        I18N.setLang(_data.lang || 'en');
      }

      applyScreenMode(_data.screenmode || 'auto');

      _readyResolve();
    }).catch(function () {
      _readyResolve();
    });
  }

  /* -- Save -- */
  function save() {
    return encrypt(JSON.stringify(_data)).then(function (val) {
      writeCookie(COOKIE, val);
    });
  }

  /* -- Get/Set -- */
  function get(path) {
    if (!path) return _data;
    var parts = path.split('.'), obj = _data;
    for (var i = 0; i < parts.length; i++) {
      if (obj == null) return undefined;
      obj = obj[parts[i]];
    }
    return obj;
  }

  function set(path, value) {
    var parts = path.split('.'), obj = _data;
    for (var i = 0; i < parts.length - 1; i++) {
      if (obj[parts[i]] == null) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
    return save();
  }

  /* -- Screen mode -- */
  function applyScreenMode(mode) {
    document.documentElement.removeAttribute('data-theme');
    if (mode === 'light' || mode === 'dark') {
      document.documentElement.setAttribute('data-theme', mode);
    }
  }

  /* -- Generic encrypted cookie helpers (use the same key/scheme as the main settings cookie) -- */
  function readEncryptedCookie(name) {
    var raw = readCookie(name);
    if (!raw) return Promise.resolve(null);
    return decrypt(raw);
  }

  function writeEncryptedCookie(name, text) {
    return encrypt(text).then(function (val) { writeCookie(name, val); });
  }

  // Auto-init
  init();

  return {
    ready: _ready,
    get: get,
    set: set,
    save: save,
    applyScreenMode: applyScreenMode,
    readEncryptedCookie: readEncryptedCookie,
    writeEncryptedCookie: writeEncryptedCookie
  };
})();
