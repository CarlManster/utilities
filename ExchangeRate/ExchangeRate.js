(function () {
'use strict';

var DEFAULT_AMOUNT = 10000;

// ── Pure helpers (testable) ──────────────────────────────────────────────────

function formatValue(value) {
  if (!isFinite(value) || value === 0) return '0';
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (value >= 1)    return value.toFixed(4);
  if (value >= 0.0001) return value.toFixed(6);
  return value.toExponential(4);
}

function matchesCurrencyFilter(code, name, filter) {
  if (!filter) return true;
  var text = (code + ' ' + name).toLowerCase();
  return text.includes(filter.toLowerCase());
}

// ── Unit-test mode: expose helpers and bail ──────────────────────────────────

function convert(amount, rate, reversed) {
  return reversed ? amount / rate : amount * rate;
}

var SORT_COLS = ['code', 'name', 'amount'];
var SORT_DIRS = ['asc', 'desc'];

function compareRows(a, b, col, dir) {
  var sign = dir === 'asc' ? 1 : -1;
  if (col === 'amount') return (a.value - b.value) * sign;
  if (col === 'name')   return a.name.localeCompare(b.name) * sign;
  return a.code.localeCompare(b.code) * sign;
}

if (window.__UNITTEST__) {
  window._ExchangeRate = {
    formatValue: formatValue,
    matchesCurrencyFilter: matchesCurrencyFilter,
    convert: convert,
    compareRows: compareRows,
    DEFAULT_AMOUNT: DEFAULT_AMOUNT
  };
  return;
}

// ── Module state ─────────────────────────────────────────────────────────────

var currencyList = {};
var rates = {};
var reversed = false;
var sortCol = 'code';
var sortDir = 'asc';

// ── DOM references ───────────────────────────────────────────────────────────

var amountInput   = document.getElementById('amountInput');
var searchInput   = document.getElementById('searchInput');
var statusEl      = document.getElementById('statusText');
var tableBody     = document.getElementById('exchangeTable');
var reverseBtn    = document.getElementById('reverseToggle');
var unitLabelEl   = document.querySelector('.currency-unit');

// ── Render ───────────────────────────────────────────────────────────────────

function renderTable() {
  var filter = searchInput.value.trim();
  var amount = parseFloat(amountInput.value);
  if (!isFinite(amount) || amount <= 0) amount = DEFAULT_AMOUNT;

  var rows = Object.keys(currencyList)
    .filter(function (code) {
      return rates[code] !== undefined && matchesCurrencyFilter(code, currencyList[code], filter);
    })
    .map(function (code) {
      return {
        code: code,
        name: currencyList[code],
        value: convert(amount, rates[code], reversed)
      };
    })
    .sort(function (a, b) { return compareRows(a, b, sortCol, sortDir); });

  tableBody.textContent = '';

  if (rows.length === 0) {
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.colSpan = 3;
    td.className = 'no-results';
    td.textContent = I18N.t('no_results', 'No currencies match your search.');
    tr.appendChild(td);
    tableBody.appendChild(tr);
    return;
  }

  var fragment = document.createDocumentFragment();
  rows.forEach(function (row) {
    var tr = document.createElement('tr');

    var tdCode = document.createElement('td');
    tdCode.className = 'col-code';
    tdCode.textContent = row.code.toUpperCase();

    var tdName = document.createElement('td');
    tdName.className = 'col-name';
    tdName.textContent = row.name;

    var tdVal = document.createElement('td');
    tdVal.className = 'col-amount';
    tdVal.textContent = formatValue(row.value);

    tr.appendChild(tdCode);
    tr.appendChild(tdName);
    tr.appendChild(tdVal);
    fragment.appendChild(tr);
  });
  tableBody.appendChild(fragment);
}

// ── Data fetch ───────────────────────────────────────────────────────────────

var CDN = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1';

function setStatus(text, isError) {
  statusEl.textContent = text;
  statusEl.className = 'status' + (isError ? ' error' : '');
}

function parseApiDate(dateStr) {
  // API returns "YYYY-MM-DD"; split to avoid timezone shift from Date parsing
  var parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2])).toLocaleDateString();
}

function loadData() {
  setStatus(I18N.t('loading', 'Loading...'), false);

  Promise.all([
    fetch(CDN + '/currencies.json').then(function (r) { return r.json(); }),
    fetch(CDN + '/currencies/krw.json').then(function (r) { return r.json(); })
  ]).then(function (results) {
    currencyList = results[0];
    var rateData  = results[1];
    rates = rateData.krw;

    setStatus(I18N.t('date_prefix', 'Reference date: ') + parseApiDate(rateData.date), false);
    renderTable();
  }).catch(function (err) {
    setStatus(I18N.t('error_load', 'Failed to load exchange rate data.'), true);
    console.error(err);
  });
}

// ── Sort headers ─────────────────────────────────────────────────────────────

var sortableHeaders = document.querySelectorAll('th[data-sort]');

function applySortIndicator() {
  for (var i = 0; i < sortableHeaders.length; i++) {
    var th = sortableHeaders[i];
    var col = th.getAttribute('data-sort');
    if (col === sortCol) {
      th.setAttribute('aria-sort', sortDir === 'asc' ? 'ascending' : 'descending');
    } else {
      th.setAttribute('aria-sort', 'none');
    }
  }
}

function persistSort() {
  Settings.set('exchangeRate', { sortCol: sortCol, sortDir: sortDir, reversed: reversed });
}

function setSort(col) {
  if (SORT_COLS.indexOf(col) === -1) return;
  if (col === sortCol) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortCol = col;
    sortDir = 'asc';
  }
  applySortIndicator();
  persistSort();
  renderTable();
}

for (var i = 0; i < sortableHeaders.length; i++) {
  (function (th) {
    th.addEventListener('click', function () {
      setSort(th.getAttribute('data-sort'));
    });
    th.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setSort(th.getAttribute('data-sort'));
      }
    });
  })(sortableHeaders[i]);
}

// ── Direction toggle ─────────────────────────────────────────────────────────

function updateUnitLabel() {
  var key = reversed ? 'unit_reversed' : 'currency_unit';
  unitLabelEl.setAttribute('data-i18n', key);
  unitLabelEl.textContent = I18N.t(key, reversed ? 'each → KRW' : 'KRW → each');
}

reverseBtn.addEventListener('click', function () {
  reversed = !reversed;
  this.setAttribute('aria-pressed', String(reversed));
  updateUnitLabel();
  persistSort();
  renderTable();
});

// ── Event listeners ──────────────────────────────────────────────────────────

amountInput.addEventListener('input', renderTable);
searchInput.addEventListener('input', renderTable);

// ── Boot ─────────────────────────────────────────────────────────────────────

Settings.ready.then(function () {
  var saved = Settings.get('exchangeRate');
  if (saved) {
    if (SORT_COLS.indexOf(saved.sortCol) !== -1) sortCol = saved.sortCol;
    if (SORT_DIRS.indexOf(saved.sortDir) !== -1) sortDir = saved.sortDir;
    if (saved.reversed === true) {
      reversed = true;
      reverseBtn.setAttribute('aria-pressed', 'true');
      updateUnitLabel();
    }
  }
  applySortIndicator();
  loadData();
});

})();
