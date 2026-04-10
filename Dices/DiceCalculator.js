let activeTab = 'csv';
let currentRows = [];
let currentMaxCount = 0;
let currentTotalCount = 0;
let sortCol = 'product';
let sortAsc = true;

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

function calculate() {
  const numberOfDice = parseInt(document.getElementById('numDice').value, 10);
  if (isNaN(numberOfDice) || numberOfDice < 1 || numberOfDice > 10) return;

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

  const totalCombinations = Math.pow(faceSetOfDice.length, numberOfDice);
  if (totalCombinations > 5_000_000) return;

  const operation = document.querySelector('input[name="operation"]:checked').value;
  const isProduct = operation === 'product';
  const headerEl = document.getElementById('resultHeader');
  headerEl.innerHTML = (isProduct ? 'Product' : 'Sum') + ' <span class="sort-arrow"></span>';
  const rollResultSet = new Map();

  function roll(remaining, acc) {
    if (remaining === 0) {
      rollResultSet.set(acc, (rollResultSet.get(acc) || 0) + 1);
      return;
    }
    for (const face of faceSetOfDice) {
      roll(remaining - 1, isProduct ? acc * face : acc + face);
    }
  }

  roll(numberOfDice, isProduct ? 1 : 0);

  // Sort by product key
  const sorted = Array.from(rollResultSet.entries()).sort((a, b) => a[0] - b[0]);

  // Calculate expected values
  let totalWeighted = 0;
  let totalCount = 0;
  const rows = [];
  for (const [product, count] of sorted) {
    const weighted = product * count;
    totalWeighted += weighted;
    totalCount += count;
    rows.push({ product, count, weighted });
  }

  const expectedValue = totalWeighted / totalCount;
  const maxCount = Math.max(...rows.map(r => r.count));

  // Assign ranks by count descending (same count = same rank)
  const countsSorted = [...new Set(rows.map(r => r.count))].sort((a, b) => b - a);
  const rankMap = new Map();
  countsSorted.forEach((c, i) => rankMap.set(c, i + 1));
  for (const row of rows) {
    row.rank = rankMap.get(row.count);
    row.prob = row.count / totalCount * 100;
  }

  currentRows = rows;
  currentMaxCount = maxCount;
  currentTotalCount = totalCount;
  sortCol = 'product';
  sortAsc = true;
  renderTable();

  // Show results
  document.getElementById('resultsSection').classList.add('visible');
  document.getElementById('expectedSection').classList.add('visible');

  // Format expected value
  const evStr = Number.isInteger(expectedValue)
    ? expectedValue.toLocaleString()
    : expectedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  document.getElementById('expectedValue').textContent = evStr;
  document.getElementById('summaryText').innerHTML =
    `${numberOfDice} dice with ${faceSetOfDice.length} faces<br>[${faceSetOfDice.join(', ')}]<br>${totalCount.toLocaleString()} total combinations<br>${rows.length} unique ${isProduct ? 'products' : 'sums'}`;
}

function renderTable() {
  const tbody = document.getElementById('resultsBody');
  tbody.innerHTML = '';
  for (const row of currentRows) {
    const barWidth = (row.count / currentMaxCount * 100);
    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td>${row.rank}</td>` +
      `<td>${row.product}</td>` +
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
  currentRows.sort((a, b) => sortAsc ? a[key] - b[key] : b[key] - a[key]);
  renderTable();
}

// Auto-calculate on load
calculate();
