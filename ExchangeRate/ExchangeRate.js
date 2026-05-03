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

if (window.__UNITTEST__) {
  window._ExchangeRate = { formatValue: formatValue, matchesCurrencyFilter: matchesCurrencyFilter, convert: convert, DEFAULT_AMOUNT: DEFAULT_AMOUNT };
  return;
}

// ── Module state ─────────────────────────────────────────────────────────────

var currencyList = {};
var rates = {};
var reversed = false;

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

  var entries = Object.keys(currencyList)
    .filter(function (code) {
      return rates[code] !== undefined && matchesCurrencyFilter(code, currencyList[code], filter);
    })
    .sort(function (a, b) { return a.localeCompare(b); });

  tableBody.textContent = '';

  if (entries.length === 0) {
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
  entries.forEach(function (code) {
    var value = convert(amount, rates[code], reversed);
    var tr = document.createElement('tr');

    var tdCode = document.createElement('td');
    tdCode.className = 'col-code';
    tdCode.textContent = code.toUpperCase();

    var tdName = document.createElement('td');
    tdName.className = 'col-name';
    tdName.textContent = currencyList[code];

    var tdVal = document.createElement('td');
    tdVal.className = 'col-amount';
    tdVal.textContent = formatValue(value);

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

// ── Direction toggle ─────────────────────────────────────────────────────────

function updateUnitLabel() {
  var key = reversed ? 'unit_reversed' : 'currency_unit';
  unitLabelEl.setAttribute('data-i18n', key);
  unitLabelEl.textContent = I18N.t(key, reversed ? 'each → KRW' : 'KRW');
}

reverseBtn.addEventListener('click', function () {
  reversed = !reversed;
  this.setAttribute('aria-pressed', String(reversed));
  updateUnitLabel();
  renderTable();
});

// ── Event listeners ──────────────────────────────────────────────────────────

amountInput.addEventListener('input', renderTable);
searchInput.addEventListener('input', renderTable);

// ── Boot ─────────────────────────────────────────────────────────────────────

Settings.ready.then(function () {
  loadData();
});

})();
