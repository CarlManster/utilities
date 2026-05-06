var I18N = (function () {
  var _data = {};
  var _allLangs = {};
  var _currentLang = null;
  var _listeners = [];

  function register(langs) {
    _allLangs = langs;
  }

  function setLang(lang) {
    var changed = (_currentLang !== lang);
    _currentLang = lang;
    _data = _allLangs[lang] || _allLangs['en'] || {};
    applyDOM();
    if (changed) {
      for (var i = 0; i < _listeners.length; i++) {
        try { _listeners[i](lang); } catch (e) { /* ignore listener errors */ }
      }
    }
  }

  // Register a callback that fires after every language change. Modules with
  // dynamic strings (rendered via I18N.t(...) into innerHTML / textContent /
  // ARIA attributes) should subscribe and re-render — applyDOM() only handles
  // static data-i18n* attributes.
  function onLangChange(cb) {
    if (typeof cb === 'function') _listeners.push(cb);
  }

  function getLang() {
    try {
      var u = new URLSearchParams(location.search).get('lang');
      if (u) return u;
    } catch (e) {}
    return 'en';
  }

  function applyDOM() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (_data[key] != null) el.textContent = _data[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (_data[key] != null) el.placeholder = _data[key];
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (_data[key] != null) el.title = _data[key];
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (_data[key] != null) el.setAttribute('aria-label', _data[key]);
    });
  }

  function t(key, fallbackOrParams, params) {
    var s = _data[key];
    if (s === undefined) {
      if (typeof fallbackOrParams === 'string') return fallbackOrParams;
      return fallbackOrParams !== undefined ? fallbackOrParams : key;
    }
    var p = params || (typeof fallbackOrParams === 'object' && !Array.isArray(fallbackOrParams) ? fallbackOrParams : null);
    if (typeof s === 'string' && p) {
      Object.keys(p).forEach(function (k) {
        s = s.replace('{' + k + '}', p[k]);
      });
    }
    return s;
  }

  return {
    register: register,
    setLang: setLang,
    getLang: getLang,
    t: t,
    apply: applyDOM,
    onLangChange: onLangChange
  };
})();
