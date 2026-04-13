function getLang() {
  return Settings.get('lang') || 'en';
}

function getTheme() {
  return Settings.get('screenmode') || 'auto';
}

function iframeParams() {
  return '?lang=' + getLang() + '&theme=' + getTheme();
}

function navigate(el) {
  document.querySelectorAll('.nav-link').forEach(function(a) { a.classList.remove('active'); });
  el.classList.add('active');
  var src = el.dataset.src;
  Settings.set('lastpage', src);
  document.getElementById('content').src = src + iframeParams();
}
