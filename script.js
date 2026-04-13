function getLang() {
  var sel = document.getElementById('langSelect');
  return sel ? sel.value : 'en';
}

function navigate(el) {
  document.querySelectorAll('.nav-link').forEach(function(a) { a.classList.remove('active'); });
  el.classList.add('active');
  document.getElementById('content').src = el.dataset.src + '?lang=' + getLang();
}
