const input = document.getElementById('qrInput');
const qrArea = document.getElementById('qrArea');
const placeholder = document.getElementById('qrPlaceholder');
const errorEl = document.getElementById('qrError');
const charCount = document.getElementById('charCount');
const recentListEl = document.getElementById('recentList');
const saveBtn = document.getElementById('saveBtn');

const RECENT_COOKIE = 'utilities_qr_recent';
const MAX_RECENT = 10;
const RECENT_DISPLAY_MAX = 60;
let recent = [];

// QR code capacity per mode at error correction level M.
const MODE_LIMITS = { Numeric: 5596, Alphanumeric: 3391, Byte: 2331 };
const NUMERIC_RE = /^[0-9]+$/;
const ALPHANUMERIC_RE = /^[0-9A-Z $%*+\-./:]+$/;

function detectMode(text) {
  if (!text) return 'Byte';
  if (NUMERIC_RE.test(text)) return 'Numeric';
  if (ALPHANUMERIC_RE.test(text)) return 'Alphanumeric';
  return 'Byte';
}

function updateCharCount() {
  const len = [...input.value].length;
  const mode = detectMode(input.value);
  const limit = MODE_LIMITS[mode];
  charCount.textContent = `${len} / ${limit} (${mode})`;
  charCount.classList.toggle('at-limit', len >= limit);
}

function updateSaveBtn() {
  saveBtn.disabled = !input.value.trim() || !!errorEl.textContent;
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
    qr.addData(text, detectMode(text));
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

function pad2(n) { return String(n).padStart(2, '0'); }

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function renderRecent() {
  recentListEl.innerHTML = '';
  if (recent.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'recent-empty';
    empty.textContent = I18N.t('recent_empty', 'No recent items');
    recentListEl.appendChild(empty);
    return;
  }
  recent.forEach(item => {
    const li = document.createElement('li');
    li.className = 'recent-item';
    li.title = item.text;

    const textDiv = document.createElement('div');
    textDiv.className = 'recent-text';
    textDiv.textContent = item.text.length > RECENT_DISPLAY_MAX
      ? item.text.slice(0, RECENT_DISPLAY_MAX) + '…'
      : item.text;

    const dateDiv = document.createElement('div');
    dateDiv.className = 'recent-date';
    dateDiv.textContent = formatDate(item.date);

    li.appendChild(textDiv);
    li.appendChild(dateDiv);
    li.addEventListener('click', () => {
      input.value = item.text;
      updateCharCount();
      render();
      input.focus();
    });
    recentListEl.appendChild(li);
  });
}

function loadRecent() {
  if (typeof Settings === 'undefined' || !Settings.readEncryptedCookie) {
    renderRecent();
    return;
  }
  Settings.readEncryptedCookie(RECENT_COOKIE).then(json => {
    if (json) {
      try {
        const arr = JSON.parse(json);
        if (Array.isArray(arr)) {
          recent = arr
            .filter(it => it && typeof it.text === 'string')
            .slice(0, MAX_RECENT);
        }
      } catch (e) {}
    }
    renderRecent();
  });
}

function saveRecent() {
  if (typeof Settings === 'undefined' || !Settings.writeEncryptedCookie) return;
  Settings.writeEncryptedCookie(RECENT_COOKIE, JSON.stringify(recent));
}

function addRecent(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  recent = recent.filter(item => item.text !== trimmed);
  recent.unshift({ text: trimmed, date: new Date().toISOString() });
  if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
  saveRecent();
  renderRecent();
}

input.addEventListener('input', () => {
  updateCharCount();
  render();
  updateSaveBtn();
});

saveBtn.addEventListener('click', () => {
  if (saveBtn.disabled) return;
  addRecent(input.value);
});

// Re-render when theme changes (system preference or data-theme attribute).
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render);
new MutationObserver(render).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme'],
});

updateCharCount();
render();
renderRecent();
updateSaveBtn();

if (typeof Settings !== 'undefined' && Settings.ready) {
  Settings.ready.then(() => {
    render();
    loadRecent();
  });
}
