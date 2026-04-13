function getLang() {
  return Settings.get('lang') || 'en';
}

function navigate(el) {
  document.querySelectorAll('.nav-link').forEach(function(a) { a.classList.remove('active'); });
  el.classList.add('active');
  var src = el.dataset.src;
  Settings.set('lastpage', src);
  document.getElementById('content').src = src + '?lang=' + getLang();
}
