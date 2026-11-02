(function () {
'use strict';

// === Segmenters (Intl.Segmenter: Chrome 87+, Safari 14.1+, Firefox 125+) ===
const HAS_SEGMENTER = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function';
const wordSegmenter = HAS_SEGMENTER ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null;
const graphemeSegmenter = HAS_SEGMENTER ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
const utf8Encoder = typeof TextEncoder === 'function' ? new TextEncoder() : null;

// A lone hyphen between two words joins them ("well-known" = 1 word).
const HYPHENS = new Set(['-', '‐', '‑']);
const HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
const WHITESPACE_ONLY = /^\s+$/u;

// === Pure helpers (testable) ===

// Fallback when Intl.Segmenter is unavailable: whitespace-separated tokens
// that contain at least one letter or digit (so a stray "-" isn't a word).
function countWordsBySpace(text) {
  if (!text) return 0;
  let n = 0;
  for (const tok of text.split(/\s+/)) {
    if (tok && HAS_LETTER_OR_DIGIT.test(tok)) n++;
  }
  return n;
}

// UAX #29 word boundaries via Intl.Segmenter. Unlike whitespace splitting,
// this also segments scripts written without spaces (Japanese, Chinese).
function countWordsBySegmenter(text, segmenter) {
  if (!text) return 0;
  let n = 0;
  let prev = null; // 'word' | 'hyphen' | null
  for (const seg of segmenter.segment(text)) {
    if (seg.isWordLike) {
      if (prev !== 'hyphen') n++;
      prev = 'word';
    } else {
      prev = (prev === 'word' && HYPHENS.has(seg.segment)) ? 'hyphen' : null;
    }
  }
  return n;
}

function countWords(text) {
  return wordSegmenter ? countWordsBySegmenter(text, wordSegmenter) : countWordsBySpace(text);
}

// User-perceived characters (grapheme clusters): "👨‍👩‍👧" and "é" are 1 each.
// One pass yields both the total and the count excluding whitespace
// (spaces, tabs, line breaks, NBSP, full-width U+3000 space, ...).
function countGraphemes(text) {
  if (!text) return { all: 0, nonSpace: 0 };
  let all = 0, space = 0;
  if (graphemeSegmenter) {
    for (const { segment } of graphemeSegmenter.segment(text)) {
      all++;
      if (WHITESPACE_ONLY.test(segment)) space++;
    }
  } else {
    for (const ch of text) { // fallback: code points
      all++;
      if (WHITESPACE_ONLY.test(ch)) space++;
    }
  }
  return { all, nonSpace: all - space };
}

function countCharacters(text) {
  return countGraphemes(text).all;
}

function countCharactersNoSpaces(text) {
  return countGraphemes(text).nonSpace;
}

// UTF-8 byte length. Lone surrogates count as U+FFFD (3 bytes), matching TextEncoder.
function countBytes(text) {
  if (!text) return 0;
  if (utf8Encoder) return utf8Encoder.encode(text).length;
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < text.length &&
             (text.charCodeAt(i + 1) & 0xFC00) === 0xDC00) { n += 4; i++; }
    else n += 3;
  }
  return n;
}

function computeStats(text) {
  const g = countGraphemes(text);
  return {
    words: countWords(text),
    chars: g.all,
    charsNoSpaces: g.nonSpace,
    bytes: countBytes(text),
  };
}

function toLocaleTag(lang) {
  return lang === 'jp' ? 'ja' : (lang || 'en');
}

// === Expose for unit tests, then bail out before touching DOM ===
if (typeof window !== 'undefined' && window.__UNITTEST__) {
  window._WordCounter = {
    countWords, countWordsBySpace, countWordsBySegmenter,
    countCharacters, countCharactersNoSpaces, countBytes, computeStats, toLocaleTag, HAS_SEGMENTER,
  };
  return;
}

// === DOM refs ===
const input = document.getElementById('textInput');
const wordEl = document.getElementById('wordCount');
const charEl = document.getElementById('charCount');
const charNoSpaceEl = document.getElementById('charNoSpaceCount');
const byteEl = document.getElementById('byteCount');
const clearBtn = document.getElementById('clearBtn');
const srStatus = document.getElementById('srStatus');

let numberFormat = new Intl.NumberFormat('en');
let pendingFrame = 0;

function setNumberLocale() {
  const lang = (typeof Settings !== 'undefined' && Settings.get) ? Settings.get('lang') : null;
  try {
    numberFormat = new Intl.NumberFormat(toLocaleTag(lang || I18N.getLang()));
  } catch (e) {
    numberFormat = new Intl.NumberFormat('en');
  }
}

function render() {
  pendingFrame = 0;
  const stats = computeStats(input.value);
  wordEl.textContent = numberFormat.format(stats.words);
  charEl.textContent = numberFormat.format(stats.chars);
  charNoSpaceEl.textContent = numberFormat.format(stats.charsNoSpaces);
  byteEl.textContent = numberFormat.format(stats.bytes);
  clearBtn.disabled = input.value.length === 0;
}

// Coalesce bursts of input (fast typing, IME composition, large pastes)
// into at most one recount per frame.
function scheduleRender() {
  if (!pendingFrame) pendingFrame = requestAnimationFrame(render);
}

function announce(msg) {
  if (!srStatus) return;
  srStatus.textContent = '';
  setTimeout(() => { srStatus.textContent = msg; }, 30);
}

input.addEventListener('input', scheduleRender);

clearBtn.addEventListener('click', () => {
  input.value = '';
  render();
  input.focus();
  announce(I18N.t('announce_cleared', 'Text cleared'));
});

render();

if (typeof Settings !== 'undefined' && Settings.ready) {
  Settings.ready.then(() => {
    setNumberLocale();
    render();
  });
}

// Number grouping follows the UI language; labels update via data-i18n.
I18N.onLangChange((lang) => {
  try { numberFormat = new Intl.NumberFormat(toLocaleTag(lang)); } catch (e) {}
  render();
});

})();
