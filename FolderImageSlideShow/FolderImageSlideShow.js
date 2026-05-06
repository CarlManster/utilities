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
var pauseBtn        = document.getElementById('pauseBtn');
var folderInfo      = document.getElementById('folderInfo');
var folderPath      = document.getElementById('folderPath');
var folderCount     = document.getElementById('folderCount');
var reloadBtn       = document.getElementById('reloadBtn');
var emptyState      = document.getElementById('emptyState');
var emptyIcon       = document.getElementById('emptyIcon');
var emptySpinner    = document.getElementById('emptySpinner');
var emptyNoFolder   = document.getElementById('emptyTextNoFolder');
var emptyLoading    = document.getElementById('emptyTextLoading');
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
var isPaused = false;
var currentDirHandle = null;

// ── Empty / slide state ──────────────────────────────────────────────────────

var EMPTY_VIEWS = {
  no_folder: emptyNoFolder,
  loading: emptyLoading,
  no_images: emptyNoImages,
  unsupported: emptyUnsupported
};

function showEmpty(which) {
  Object.keys(EMPTY_VIEWS).forEach(function (key) {
    EMPTY_VIEWS[key].hidden = (key !== which);
  });
  var loading = (which === 'loading');
  emptyIcon.hidden = loading;
  emptySpinner.hidden = !loading;
  emptyState.hidden = false;
  slide.hidden = true;
}

function showSlide() {
  emptyState.hidden = true;
  slide.hidden = false;
}

function updateFolderInfo(name, count) {
  if (name == null) {
    folderInfo.hidden = true;
    return;
  }
  folderInfo.hidden = false;
  folderPath.textContent = name;
  folderPath.title = name;
  folderCount.textContent = I18N.t('folder_count', '{n} images', { n: count });
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
  if (isPaused || entries.length === 0) return;
  timerId = setTimeout(function () {
    currentIndex = (currentIndex + 1) % entries.length;
    showCurrent();
  }, intervalSec * 1000);
}

// ── Pause / Resume ───────────────────────────────────────────────────────────

function updatePauseUI() {
  pauseBtn.setAttribute('aria-pressed', String(isPaused));
  pauseBtn.textContent = isPaused ? '▶' : '⏸';
  var key = isPaused ? 'btn_resume' : 'btn_pause';
  var fb  = isPaused ? 'Resume' : 'Pause';
  var label = I18N.t(key, fb);
  pauseBtn.setAttribute('aria-label', label);
  pauseBtn.title = label;
}

function setPaused(paused) {
  isPaused = paused;
  updatePauseUI();
}

function togglePause() {
  if (pauseBtn.disabled) return;
  isPaused = !isPaused;
  updatePauseUI();
  if (isPaused) {
    clearTimer();
  } else {
    scheduleNext();
  }
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
    showSlide(); // first frame ready: leave the loading state
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

function loadFromHandle(dirHandle, opts) {
  opts = opts || {};
  // Tear down the previous run before starting the new scan so a stale
  // `showCurrent` resolution can't leak through.
  clearTimer();
  releasePrevUrl();
  loadId++;
  entries = [];
  currentIndex = 0;
  currentDirHandle = dirHandle;

  pauseBtn.disabled = true;
  reloadBtn.disabled = true;
  updateFolderInfo(dirHandle.name, 0);
  showEmpty('loading');

  var thisLoad = loadId;
  return collectImages(dirHandle, function (n) {
    if (thisLoad !== loadId) return;
    updateFolderInfo(dirHandle.name, n);
  }).then(function (found) {
    if (thisLoad !== loadId) return;
    entries = found;
    updateFolderInfo(dirHandle.name, entries.length);
    reloadBtn.disabled = false;

    if (entries.length === 0) {
      pauseBtn.disabled = true;
      showEmpty('no_images');
      return;
    }
    pauseBtn.disabled = false;
    if (opts.resetPause) setPaused(false);
    // Stay in the loading state until the first frame is decoded; showCurrent
    // calls showSlide() once the image is actually loaded. scheduleNext within
    // showCurrent respects isPaused, so a paused reload stays on the new frame.
    showCurrent();
  });
}

function onSelectFolder() {
  var pick = getDirectoryPicker();
  if (!pick) {
    showEmpty('unsupported');
    return;
  }
  pick().then(function (dirHandle) {
    return loadFromHandle(dirHandle, { resetPause: true });
  }).catch(function (err) {
    // AbortError = user cancelled the picker; ignore.
    if (err && err.name === 'AbortError') return;
    console.warn('[FolderImageSlideShow] folder selection failed:', err);
    showEmpty('unsupported');
  });
}

function onReload() {
  if (!currentDirHandle || reloadBtn.disabled) return;
  loadFromHandle(currentDirHandle, { resetPause: false }).catch(function (err) {
    console.warn('[FolderImageSlideShow] reload failed:', err);
  });
}

function collectImages(dirHandle, onProgress) {
  var collected = [];
  var seen = 0;
  return (async function () {
    for await (var entry of dirHandle.values()) {
      if (entry.kind === 'file' && isImageFile(entry.name)) {
        collected.push(entry);
        if (onProgress) onProgress(collected.length);
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
pauseBtn.addEventListener('click', togglePause);
reloadBtn.addEventListener('click', onReload);

window.addEventListener('beforeunload', function () {
  clearTimer();
  releasePrevUrl();
});

Settings.ready.then(function () {
  var saved = Settings.get(STORAGE_KEY);
  applyInterval(typeof saved === 'number' ? saved : DEFAULT_INTERVAL_SEC, { persist: false });
  updatePauseUI();
  // Always start in the "no folder" state. We only label the browser as
  // unsupported after the click handler has actually tried to open a picker,
  // since some Chromium variants only expose showDirectoryPicker on the top
  // window and the iframe's own `window` returns undefined on initial load.
  showEmpty('no_folder');
});

})();
