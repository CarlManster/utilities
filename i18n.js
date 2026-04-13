var I18N = (function () {
  var _data = {};

  function load(path) {
    return fetch(path)
      .then(function (r) { return r.json(); })
      .then(function (json) {
        _data = json;
        applyDOM();
        document.dispatchEvent(new Event('i18n-loaded'));
      })
      .catch(function () {});
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
      // t('key', 'fallback') or t('key', 'fallback', {params})
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

  return { load: load, t: t, apply: applyDOM };
})();
