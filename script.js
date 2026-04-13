function getLang() {
  var sel = document.getElementById('langSelect');
  return sel ? sel.value : 'en';
}

function navigate(el) {
  document.querySelectorAll('.nav-link').forEach(function(a) { a.classList.remove('active'); });
  el.classList.add('active');
  var src = el.dataset.src;
  var d = new Date(); d.setFullYear(d.getFullYear() + 1);
  document.cookie = 'utilities_page=' + encodeURIComponent(src) + ';expires=' + d.toUTCString() + ';path=/';
  document.getElementById('content').src = src + '?lang=' + getLang();
}

function getSavedPage() {
  var m = document.cookie.match(/(^|;\s*)utilities_page=([^;]*)/);
  return m ? decodeURIComponent(m[2]) : '';
}
