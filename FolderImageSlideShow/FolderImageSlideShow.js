(function () {
'use strict';

var DEFAULT_INTERVAL_SEC = 2;
var MIN_INTERVAL_SEC = 1;
var MAX_INTERVAL_SEC = 10;
var INTERVAL_STEP_SEC = 0.5;
var STORAGE_KEY = 'slideshow.interval';
var IMAGE_RE = /\.(jpg|jpeg|png|gif|webp|bmp)$/i;

// ── Pure helpers (testable) ──────────────────────────────────────────────────

function isImageFile(name) {
  return IMAGE_RE.test(String(name || ''));
}

function clampInterval(sec) {
  var n = Number(sec);
  if (!isFinite(n)) return DEFAULT_INTERVAL_SEC;
  if (n < MIN_INTERVAL_SEC) return MIN_INTERVAL_SEC;
  if (n > MAX_INTERVAL_SEC) return MAX_INTERVAL_SEC;
  // Snap to the nearest step.
  var steps = Math.round((n - MIN_INTERVAL_SEC) / INTERVAL_STEP_SEC);
  return MIN_INTERVAL_SEC + steps * INTERVAL_STEP_SEC;
}

function formatInterval(sec) {
  return sec.toFixed(1) + 's';
}

if (window.__UNITTEST__) {
  window._FolderImageSlideShow = {
    isImageFile: isImageFile,
    clampInterval: clampInterval,
    formatInterval: formatInterval,
    MIN_INTERVAL_SEC: MIN_INTERVAL_SEC,
    MAX_INTERVAL_SEC: MAX_INTERVAL_SEC,
    INTERVAL_STEP_SEC: INTERVAL_STEP_SEC
  };
  return;
}

// ── DOM references ───────────────────────────────────────────────────────────

var selectBtn       = document.getElementById('selectFolder');
var intervalRange   = document.getElementById('intervalRange');
var intervalValueEl = document.getElementById('intervalValue');
var emptyState      = document.getElementById('emptyState');
var emptyNoFolder   = document.getElementById('emptyTextNoFolder');
var emptyNoImages   = document.getElementById('emptyTextNoImages');
var emptyUnsupported = document.getElementById('emptyTextUnsupported');
var slide           = document.getElementById('slide');
var viewer          = document.getElementById('viewer');
var caption         = document.getElementById('caption');

// ── Module state ─────────────────────────────────────────────────────────────

var intervalSec = DEFAULT_INTERVAL_SEC;
var entries = [];
var currentIndex = 0;
var timerId = null;
var prevUrl = null;
var loadId = 0; // monotonic id so a stale folder scan can't override a newer one

// ── Empty / slide state ──────────────────────────────────────────────────────

var EMPTY_VIEWS = {
  no_folder: emptyNoFolder,
  no_images: emptyNoImages,
  unsupported: emptyUnsupported
};

function showEmpty(which) {
  Object.keys(EMPTY_VIEWS).forEach(function (key) {
    EMPTY_VIEWS[key].hidden = (key !== which);
  });
  emptyState.hidden = false;
  slide.hidden = true;
}

function showSlide() {
  emptyState.hidden = true;
  slide.hidden = false;
}

// ── Slideshow ────────────────────────────────────────────────────────────────

function clearTimer() {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function releasePrevUrl() {
  if (prevUrl) {
    URL.revokeObjectURL(prevUrl);
    prevUrl = null;
  }
}

function scheduleNext() {
  clearTimer();
  timerId = setTimeout(function () {
    currentIndex = (currentIndex + 1) % entries.length;
    showCurrent();
  }, intervalSec * 1000);
}

function showCurrent() {
  if (entries.length === 0) return;
  var entry = entries[currentIndex];
  var thisLoad = loadId;
  entry.getFile().then(function (file) {
    if (thisLoad !== loadId) return; // a newer folder was selected
    var url = URL.createObjectURL(file);
    viewer.src = url;
    viewer.alt = entry.name;
    caption.textContent = entry.name;
    releasePrevUrl();
    prevUrl = url;
    scheduleNext();
  }).catch(function () {
    if (thisLoad !== loadId) return;
    // Skip the broken entry; advance after the regular interval.
    scheduleNext();
  });
}

// ── Folder selection ─────────────────────────────────────────────────────────

// Some Chromium variants (e.g. Whale) only expose showDirectoryPicker on the
// top-level window, so a same-origin iframe sees `undefined` on its own
// `window`. We fall back to `window.top` when accessible.
function getDirectoryPicker() {
  if (typeof window.showDirectoryPicker === 'function') {
    return window.showDirectoryPicker.bind(window);
  }
  try {
    if (window.top && window.top !== window && typeof window.top.showDirectoryPicker === 'function') {
      return window.top.showDirectoryPicker.bind(window.top);
    }
  } catch (e) {
    // Cross-origin top frame: cannot reach it.
    console.warn('[FolderImageSlideShow] window.top.showDirectoryPicker access failed:', e);
  }
  return null;
}

function onSelectFolder() {
  var pick = getDirectoryPicker();
  if (!pick) {
    showEmpty('unsupported');
    return;
  }
  pick().then(function (dirHandle) {
    return collectImages(dirHandle);
  }).then(function (found) {
    clearTimer();
    releasePrevUrl();
    loadId++;
    entries = found;
    currentIndex = 0;

    if (entries.length === 0) {
      showEmpty('no_images');
      return;
    }
    showSlide();
    showCurrent();
  }).catch(function (err) {
    // AbortError = user cancelled the picker; ignore.
    if (err && err.name === 'AbortError') return;
    showEmpty('unsupported');
  });
}

function collectImages(dirHandle) {
  var collected = [];
  var seen = 0;
  return (async function () {
    for await (var entry of dirHandle.values()) {
      if (entry.kind === 'file' && isImageFile(entry.name)) {
        collected.push(entry);
      }
      if (++seen % 50 === 0) await new Promise(requestAnimationFrame);
    }
    collected.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return collected;
  })();
}

// ── Interval control ─────────────────────────────────────────────────────────

function applyInterval(sec, opts) {
  intervalSec = clampInterval(sec);
  intervalRange.value = String(intervalSec);
  intervalValueEl.textContent = formatInterval(intervalSec);
  if (opts && opts.persist) Settings.set(STORAGE_KEY, intervalSec);
  if (timerId !== null) scheduleNext();
}

function onIntervalChange() {
  applyInterval(intervalRange.value, { persist: true });
}

// ── Init ─────────────────────────────────────────────────────────────────────

selectBtn.addEventListener('click', onSelectFolder);
intervalRange.addEventListener('input', onIntervalChange);

window.addEventListener('beforeunload', function () {
  clearTimer();
  releasePrevUrl();
});

Settings.ready.then(function () {
  var saved = Settings.get(STORAGE_KEY);
  applyInterval(typeof saved === 'number' ? saved : DEFAULT_INTERVAL_SEC, { persist: false });
  // Always start in the "no folder" state. We only label the browser as
  // unsupported after the click handler has actually tried to open a picker,
  // since some Chromium variants only expose showDirectoryPicker on the top
  // window and the iframe's own `window` returns undefined on initial load.
  showEmpty('no_folder');
});

})();
