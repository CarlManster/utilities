var I18N = (function () {
  var _data = {};
  var _allLangs = {};

  function register(langs) {
    _allLangs = langs;
  }

  function setLang(lang) {
    _data = _allLangs[lang] || _allLangs['en'] || {};
    applyDOM();
    document.dispatchEvent(new Event('i18n-loaded'));
  }

  function getLang() {
    return new URLSearchParams(location.search).get('lang')
      || (document.cookie.match(/(^|;\s*)utilities_lang=([^;]*)/) || [])[2]
      || 'en';
  }

  function init(langs) {
    register(langs);
    setLang(getLang());
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

  return { init: init, setLang: setLang, getLang: getLang, t: t, apply: applyDOM };
})();
