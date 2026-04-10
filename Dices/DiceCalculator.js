let activeTab = 'csv';
let currentRows = [];
let currentMaxCount = 0n;
let currentTotalCount = 0n;
let sortCol = 'product';
let sortAsc = true;
let calcId = 0;

const TABLE_LIMIT = 50_000;
const COMPUTE_LIMIT = 500_000;

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab').forEach((el, i) => {
    el.classList.toggle('active', (i === 0 && tab === 'csv') || (i === 1 && tab === 'range'));
  });
  document.getElementById('tabCsv').classList.toggle('active', tab === 'csv');
  document.getElementById('tabRange').classList.toggle('active', tab === 'range');
  calculate();
}

function applyPreset(numDice, faces) {
  document.getElementById('numDice').value = numDice;
  document.getElementById('faceValues').value = faces;
  switchTab('csv');
  calculate();
}

function showLoading(show) {
  document.getElementById('loadingOverlay').classList.toggle('visible', show);
}

function analyticalExpectedValue(faces, numDice, isProduct) {
  const mean = faces.reduce((a, b) => a + b, 0) / faces.length;
  return isProduct ? Math.pow(mean, numDice) : mean * numDice;
}

function showExpectedValue(expectedValue, numberOfDice, faceSetOfDice, totalInfo, isProduct) {
  document.getElementById('expectedSection').classList.add('visible');
  const evStr = Number.isInteger(expectedValue)
    ? expectedValue.toLocaleString()
    : expectedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  document.getElementById('expectedValue').textContent = evStr;
  document.getElementById('summaryText').innerHTML = totalInfo;
}

function showTableError(message) {
  const tbody = document.getElementById('resultsBody');
  tbody.innerHTML = '';
  const tr = document.createElement('tr');
  tr.innerHTML = `<td colspan="5" class="table-error">${message}</td>`;
  tbody.appendChild(tr);
  document.getElementById('resultsSection').classList.add('visible');
}

function calculate() {
  const errorEl = document.getElementById('diceError');
  const numberOfDice = parseInt(document.getElementById('numDice').value, 10);
  if (isNaN(numberOfDice) || numberOfDice < 1) {
    errorEl.textContent = 'Please enter the number of dice (1~20).';
    return;
  }
  if (numberOfDice > 20) {
    errorEl.textContent = 'Maximum 20 dice allowed.';
    return;
  }
  errorEl.textContent = '';

  let faceSetOfDice;
  if (activeTab === 'csv') {
    const facesRaw = document.getElementById('faceValues').value.trim();
    faceSetOfDice = facesRaw.split(',').map(s => s.trim()).filter(s => s !== '').map(Number);
    if (faceSetOfDice.length === 0 || faceSetOfDice.some(isNaN)) return;
  } else {
    const start = parseInt(document.getElementById('rangeStart').value, 10);
    const end = parseInt(document.getElementById('rangeEnd').value, 10);
    if (isNaN(start) || isNaN(end) || start > end) return;
    faceSetOfDice = [];
    for (let i = start; i <= end; i++) faceSetOfDice.push(i);
  }

  const operation = document.querySelector('input[name="operation"]:checked').value;
  const isProduct = operation === 'product';
  const headerEl = document.getElementById('resultHeader');
  headerEl.innerHTML = (isProduct ? 'Product' : 'Sum') + ' <span class="sort-arrow"></span>';

  const thisCalcId = ++calcId;
  showLoading(true);

  setTimeout(() => {
    if (thisCalcId !== calcId) return;

    // Map-based convolution: value -> count (BigInt)
    let dist = new Map();
    dist.set(isProduct ? 1 : 0, 1n);

    let aborted = false;
    for (let d = 0; d < numberOfDice; d++) {
      const next = new Map();
      for (const [val, count] of dist) {
        for (const face of faceSetOfDice) {
          const newVal = isProduct ? val * face : val + face;
          next.set(newVal, (next.get(newVal) || 0n) + count);
        }
      }
      dist = next;
      if (dist.size > COMPUTE_LIMIT) {
        aborted = true;
        break;
      }
    }

    if (thisCalcId !== calcId) return;

    const totalCombStr = BigInt(faceSetOfDice.length) ** BigInt(numberOfDice);

    if (aborted) {
      const ev = analyticalExpectedValue(faceSetOfDice, numberOfDice, isProduct);
      showExpectedValue(ev, numberOfDice, faceSetOfDice,
        `${numberOfDice} dice with ${faceSetOfDice.length} faces<br>[${faceSetOfDice.join(', ')}]<br>${totalCombStr.toLocaleString()} total combinations`,
        isProduct);
      showTableError(
        `Too many unique ${isProduct ? 'products' : 'sums'} to compute (over ${COMPUTE_LIMIT.toLocaleString()}).<br>` +
        `Try fewer dice or fewer face values.`
      );
      showLoading(false);
      return;
    }

    // Sort by value
    const sorted = Array.from(dist.entries()).sort((a, b) => a[0] - b[0]);

    // Calculate expected values and total count
    let totalWeighted = 0;
    let totalCount = 0n;
    const rows = [];
    for (const [product, count] of sorted) {
      totalWeighted += product * Number(count);
      totalCount += count;
      rows.push({ product, count });
    }

    const totalCountNum = Number(totalCount);
    const expectedValue = totalWeighted / totalCountNum;
    const maxCount = rows.reduce((max, r) => r.count > max ? r.count : max, 0n);

    // Assign ranks by count descending (same count = same rank)
    const countsSorted = [...new Set(rows.map(r => r.count))].sort((a, b) => (b > a ? 1 : b < a ? -1 : 0));
    const rankMap = new Map();
    countsSorted.forEach((c, i) => rankMap.set(c, i + 1));
    for (const row of rows) {
      row.rank = rankMap.get(row.count);
      row.prob = Number(row.count) / totalCountNum * 100;
    }

    const totalInfo =
      `${numberOfDice} dice with ${faceSetOfDice.length} faces<br>[${faceSetOfDice.join(', ')}]<br>${totalCount.toLocaleString()} total combinations<br>${rows.length} unique ${isProduct ? 'products' : 'sums'}`;

    // Show expected value
    showExpectedValue(expectedValue, numberOfDice, faceSetOfDice, totalInfo, isProduct);

    if (rows.length > TABLE_LIMIT) {
      showTableError(
        `Too many unique ${isProduct ? 'products' : 'sums'} to display (${rows.length.toLocaleString()} rows, limit ${TABLE_LIMIT.toLocaleString()}).<br>` +
        `The expected value is still shown above.`
      );
      showLoading(false);
      return;
    }

    currentRows = rows;
    currentMaxCount = maxCount;
    currentTotalCount = totalCount;
    sortCol = 'product';
    sortAsc = true;
    renderTable();

    document.getElementById('resultsSection').classList.add('visible');
    document.getElementById('expectedSection').classList.add('visible');

    showLoading(false);
  }, 0);
}

function renderTable() {
  const tbody = document.getElementById('resultsBody');
  tbody.innerHTML = '';
  for (const row of currentRows) {
    const barWidth = Number(row.count) / Number(currentMaxCount) * 100;
    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td>${row.rank}</td>` +
      `<td>${row.product.toLocaleString()}</td>` +
      `<td>${row.count.toLocaleString()}</td>` +
      `<td>${row.prob.toFixed(4)}%</td>` +
      `<td class="bar-cell"><span class="bar" style="width:${barWidth}%"></span></td>`;
    tbody.appendChild(tr);
  }
  // Update header arrows
  document.querySelectorAll('#resultsSection th').forEach(th => {
    const col = th.dataset.col;
    const arrow = th.querySelector('.sort-arrow');
    if (!col || !arrow) return;
    if (col === sortCol) {
      th.classList.add('sorted');
      arrow.textContent = sortAsc ? '\u25B2' : '\u25BC';
    } else {
      th.classList.remove('sorted');
      arrow.textContent = '';
    }
  });
}

function sortTable(col) {
  if (sortCol === col) {
    sortAsc = !sortAsc;
  } else {
    sortCol = col;
    sortAsc = true;
  }
  const key = (col === 'prob' || col === 'dist') ? 'count' : col;
  currentRows.sort((a, b) => {
    const av = a[key], bv = b[key];
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });
  renderTable();
}

// Auto-calculate on load
calculate();
