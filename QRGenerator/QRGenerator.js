(function () {
'use strict';

// === Constants ===
const RECENT_COOKIE = 'utilities_qr_recent';
const MAX_RECENT = 10;
const RECENT_DISPLAY_MAX = 60;

// QR code capacity per mode at error correction level M.
const MODE_LIMITS = { Numeric: 5596, Alphanumeric: 3391, Byte: 2331 };
const NUMERIC_RE = /^[0-9]+$/;
const ALPHANUMERIC_RE = /^[0-9A-Z $%*+\-./:]+$/;

// === Pure helpers (testable) ===

function detectMode(text) {
  if (!text) return 'Byte';
  if (NUMERIC_RE.test(text)) return 'Numeric';
  if (ALPHANUMERIC_RE.test(text)) return 'Alphanumeric';
  return 'Byte';
}

function pad2(n) { return String(n).padStart(2, '0'); }

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function truncateForDisplay(text, max) {
  if (text == null) return '';
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

// Pure function for adding a new entry to the recent list with dedup + cap.
function computeAddRecent(list, text, date, max) {
  const trimmed = (text || '').trim();
  if (!trimmed) return list.slice();
  const filtered = list.filter(it => it && it.text !== trimmed);
  filtered.unshift({ text: trimmed, date: date || new Date().toISOString() });
  return filtered.slice(0, max);
}

// === Expose for unit tests, then bail out before touching DOM ===
if (typeof window !== 'undefined' && window.__UNITTEST__) {
  window._QRGenerator = {
    detectMode, pad2, formatDate, truncateForDisplay, computeAddRecent,
    MODE_LIMITS, MAX_RECENT, RECENT_DISPLAY_MAX,
  };
  return;
}

// === DOM refs ===
const input = document.getElementById('qrInput');
const qrArea = document.getElementById('qrArea');
const placeholder = document.getElementById('qrPlaceholder');
const errorEl = document.getElementById('qrError');
const charCount = document.getElementById('charCount');
const recentListEl = document.getElementById('recentList');
const saveBtn = document.getElementById('saveBtn');
const srStatus = document.getElementById('srStatus');

let recent = [];

function announce(msg) {
  if (!srStatus) return;
  srStatus.textContent = '';
  // Re-set on next tick so SRs notice the change even when text repeats.
  setTimeout(() => { srStatus.textContent = msg; }, 30);
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

function setQRAreaLabel(text) {
  if (!text) {
    qrArea.setAttribute('aria-label', I18N.t('aria_qr_area_empty', 'QR code preview (empty)'));
  } else {
    const preview = truncateForDisplay(text, 60);
    qrArea.setAttribute('aria-label', I18N.t('aria_qr_area_for', 'QR code for: {text}', { text: preview }));
  }
}

function render() {
  const text = input.value;
  clearCanvases();

  if (!text) {
    placeholder.hidden = false;
    errorEl.textContent = '';
    setQRAreaLabel('');
    return;
  }

  if (typeof qrcode !== 'function') {
    placeholder.hidden = false;
    errorEl.textContent = I18N.t('error_lib', 'Failed to load the QR library.');
    setQRAreaLabel('');
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
    canvas.setAttribute('role', 'img');

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
    setQRAreaLabel(text);
  } catch (e) {
    placeholder.hidden = false;
    errorEl.textContent = I18N.t('error_generate', 'Could not generate QR code: ') + e.message;
    setQRAreaLabel('');
  }
}

function loadRecentItem(item) {
  input.value = item.text;
  updateCharCount();
  render();
  updateSaveBtn();
  input.focus();
  announce(I18N.t('announce_loaded', 'Loaded recent item'));
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
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'recent-item';
    btn.title = item.text;
    btn.setAttribute('aria-label', I18N.t('aria_recent_item', 'Load recent: {text}', {
      text: truncateForDisplay(item.text, 80)
    }));

    const textDiv = document.createElement('div');
    textDiv.className = 'recent-text';
    textDiv.textContent = truncateForDisplay(item.text, RECENT_DISPLAY_MAX);

    const dateDiv = document.createElement('div');
    dateDiv.className = 'recent-date';
    dateDiv.textContent = formatDate(item.date);

    btn.appendChild(textDiv);
    btn.appendChild(dateDiv);
    btn.addEventListener('click', () => loadRecentItem(item));

    li.appendChild(btn);
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
  if (!text.trim()) return;
  recent = computeAddRecent(recent, text, null, MAX_RECENT);
  saveRecent();
  renderRecent();
  announce(I18N.t('announce_saved', 'Saved to recent list'));
}

input.addEventListener('input', () => {
  updateCharCount();
  render();
  updateSaveBtn();
});

// Ctrl/Cmd + Enter inside textarea = save
input.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    if (!saveBtn.disabled) {
      addRecent(input.value);
    }
  }
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

})();
