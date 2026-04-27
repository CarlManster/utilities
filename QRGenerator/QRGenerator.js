const input = document.getElementById('qrInput');
const qrArea = document.getElementById('qrArea');
const placeholder = document.getElementById('qrPlaceholder');
const errorEl = document.getElementById('qrError');
const charCount = document.getElementById('charCount');

function updateCharCount() {
  charCount.textContent = [...input.value].length;
}

function resolveTheme() {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark' || attr === 'light') return attr;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getQRColors() {
  const styles = getComputedStyle(document.documentElement);
  const fg = styles.getPropertyValue('--qr-fg').trim();
  const bg = styles.getPropertyValue('--qr-bg').trim();
  const dark = resolveTheme() === 'dark';
  return {
    fg: fg || (dark ? '#ffffff' : '#000000'),
    bg: bg || (dark ? '#1f1f23' : '#ffffff'),
  };
}

function clearCanvases() {
  qrArea.querySelectorAll('canvas').forEach(c => c.remove());
}

function render() {
  const text = input.value;
  clearCanvases();

  if (!text) {
    placeholder.hidden = false;
    errorEl.textContent = '';
    return;
  }

  if (typeof qrcode !== 'function') {
    placeholder.hidden = false;
    errorEl.textContent = I18N.t('error_lib', 'Failed to load the QR library.');
    return;
  }

  try {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const cellSize = 8;
    const margin = 4;
    const size = (moduleCount + margin * 2) * cellSize;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    const colors = getQRColors();
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = colors.fg;
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect((c + margin) * cellSize, (r + margin) * cellSize, cellSize, cellSize);
        }
      }
    }

    qrArea.appendChild(canvas);
    placeholder.hidden = true;
    errorEl.textContent = '';
  } catch (e) {
    placeholder.hidden = false;
    errorEl.textContent = I18N.t('error_generate', 'Could not generate QR code: ') + e.message;
  }
}

input.addEventListener('input', () => {
  updateCharCount();
  render();
});

// Re-render when theme changes (system preference or data-theme attribute).
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render);
new MutationObserver(render).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme'],
});

updateCharCount();
render();

if (typeof Settings !== 'undefined' && Settings.ready) {
  Settings.ready.then(render);
}
