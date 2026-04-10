function navigate(el) {
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('content').src = el.dataset.src;
}
