(function () {
'use strict';

/* ── Formatting ── */

function fmt(n) {
  return Math.round(n).toLocaleString();
}

function parseAmount(s) {
  return parseInt(String(s).replace(/[^0-9]/g, ''), 10) || 0;
}

/* ── Amount input formatting ── */

var amountEl = document.getElementById('loanAmount');
amountEl.addEventListener('input', function () {
  var v = parseAmount(this.value);
  var pos = this.selectionStart;
  var oldLen = this.value.length;
  this.value = v ? v.toLocaleString() : '';
  var newLen = this.value.length;
  this.setSelectionRange(pos + newLen - oldLen, pos + newLen - oldLen);
});

/* ── Slider sync ── */

var slider = document.getElementById('rateSlider');
var rateInput = document.getElementById('interestRate');
slider.addEventListener('input', function () {
  rateInput.value = (this.value / 100).toFixed(2);
});
rateInput.addEventListener('input', function () {
  slider.value = Math.round(parseFloat(this.value) * 100) || 0;
});

/* ── Quick buttons ── */

window.addAmount = function (n) {
  var v = parseAmount(amountEl.value) + n;
  if (v > 1000000000) v = 1000000000;
  amountEl.value = v.toLocaleString();
};
window.resetAmount = function () { amountEl.value = ''; };

var termEl = document.getElementById('loanTerm');
window.addTerm = function (n) {
  var v = Math.min((parseInt(termEl.value) || 0) + n, 480);
  termEl.value = v;
};
window.resetTerm = function () { termEl.value = ''; };

var graceEl = document.getElementById('gracePeriod');
window.addGrace = function (n) {
  var v = Math.min((parseInt(graceEl.value) || 0) + n, 480);
  graceEl.value = v;
};
window.resetGrace = function () { graceEl.value = ''; };

/* ── Calculation ── */

function getMethod() {
  return document.querySelector('input[name="method"]:checked').value;
}

function calculate() {
  var P = parseAmount(amountEl.value);
  var n = parseInt(termEl.value) || 0;
  var g = parseInt(graceEl.value) || 0;
  var r = parseFloat(rateInput.value) / 100 || 0;

  if (P <= 0 || n <= 0 || g >= n) return;

  var method = getMethod();
  var monthlyRate = r / 12;
  var repayMonths = n - g;
  var rows = [];
  var balance = P;
  var cumPrincipal = 0;
  var totalInterest = 0;
  var monthlyPaymentDisplay = 0;

  if (method === 'principal') {
    // Equal principal repayment
    var monthlyPrincipal = Math.round(P / repayMonths);

    for (var i = 1; i <= n; i++) {
      var interest = Math.round(balance * monthlyRate);
      var principal = 0;
      if (i > g) {
        principal = (i === n) ? balance : monthlyPrincipal;
        if (principal > balance) principal = balance;
      }
      var payment = principal + interest;
      balance -= principal;
      cumPrincipal += principal;
      totalInterest += interest;
      rows.push({ period: i, payment: payment, principal: principal, interest: interest, cumPrincipal: cumPrincipal, balance: balance, isGrace: i <= g });
    }
    monthlyPaymentDisplay = monthlyPrincipal;

  } else {
    // Equal principal + interest (annuity)
    var M = 0;
    if (monthlyRate > 0) {
      var factor = Math.pow(1 + monthlyRate, repayMonths);
      M = Math.round(P * monthlyRate * factor / (factor - 1));
    } else {
      M = Math.round(P / repayMonths);
    }

    for (var i = 1; i <= n; i++) {
      var interest = Math.round(balance * monthlyRate);
      var principal = 0;
      var payment = 0;
      if (i > g) {
        payment = (i === n) ? balance + interest : M;
        principal = payment - interest;
        if (principal > balance) { principal = balance; payment = principal + interest; }
      } else {
        payment = interest;
      }
      balance -= principal;
      cumPrincipal += principal;
      totalInterest += interest;
      rows.push({ period: i, payment: payment, principal: principal, interest: interest, cumPrincipal: cumPrincipal, balance: Math.max(0, balance), isGrace: i <= g });
    }
    monthlyPaymentDisplay = M;
  }

  // Update summary
  var labelEl = document.getElementById('monthlyLabel');
  if (method === 'principal') {
    labelEl.textContent = I18N.t('monthly_principal', 'Monthly Principal');
  } else {
    labelEl.textContent = I18N.t('monthly_payment', 'Monthly Payment');
  }
  document.getElementById('monthlyValue').textContent = fmt(monthlyPaymentDisplay);
  document.getElementById('totalInterest').textContent = fmt(totalInterest);
  document.getElementById('totalPayment').textContent = fmt(P + totalInterest);

  // Build table
  var tbody = document.getElementById('scheduleBody');
  tbody.innerHTML = '';
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var tr = document.createElement('tr');
    if (row.isGrace) tr.className = 'grace';
    tr.innerHTML =
      '<td>' + row.period + '</td>' +
      '<td>' + fmt(row.payment) + '</td>' +
      '<td>' + (row.principal ? fmt(row.principal) : '-') + '</td>' +
      '<td>' + (row.interest ? fmt(row.interest) : '-') + '</td>' +
      '<td>' + fmt(row.cumPrincipal) + '</td>' +
      '<td>' + fmt(row.balance) + '</td>';
    tbody.appendChild(tr);
  }

  document.getElementById('results').hidden = false;

  // Save to settings
  Settings.set('repayment', {
    principal: P,
    period: n,
    holding: g,
    interest: parseFloat(rateInput.value) || 0
  });
}

/* ── Auto-calculate with throttle ── */

var _calcTimer = null;
function scheduleCalc() {
  if (_calcTimer) return;
  _calcTimer = setTimeout(function () { _calcTimer = null; calculate(); }, 200);
}

['input', 'change'].forEach(function (evt) {
  amountEl.addEventListener(evt, scheduleCalc);
  termEl.addEventListener(evt, scheduleCalc);
  graceEl.addEventListener(evt, scheduleCalc);
  rateInput.addEventListener(evt, scheduleCalc);
  slider.addEventListener(evt, scheduleCalc);
});
document.querySelectorAll('input[name="method"]').forEach(function (el) {
  el.addEventListener('change', scheduleCalc);
});

/* ── Init ── */

Settings.ready.then(function () {
  var saved = Settings.get('repayment');
  if (saved) {
    if (saved.principal) amountEl.value = saved.principal.toLocaleString();
    if (saved.period) termEl.value = saved.period;
    if (saved.holding != null) graceEl.value = saved.holding;
    if (saved.interest != null) {
      rateInput.value = saved.interest.toFixed(2);
      slider.value = Math.round(saved.interest * 100);
    }
  }
  calculate();
});

})();
