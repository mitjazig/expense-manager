import { CATEGORIES } from './config.js';
import { getAllExpenses } from './db.js';
import { CHART, baseChartOptions } from './chart-theme.js';

const $ = (sel) => document.querySelector(sel);
const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]));

let allExpenses = [];
let viewYear;
let viewMonth; // 1-12
let doughnutChart;
let trendChart;

function formatMoney(amount) {
  return amount.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function monthLabel(year, month) {
  const d = new Date(year, month - 1, 1);
  const label = d.toLocaleDateString('sl-SI', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function shortMonthLabel(year, month) {
  const d = new Date(year, month - 1, 1);
  const label = d.toLocaleDateString('sl-SI', { month: 'short' });
  return (label.charAt(0).toUpperCase() + label.slice(1)).replace('.', '');
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function shiftMonth(year, month, delta) {
  let m = month + delta;
  let y = year;
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  return [y, m];
}

function expensesForMonth(year, month) {
  return allExpenses.filter((e) => {
    const [y, m] = e.date.split('-').map(Number);
    return y === year && m === month;
  });
}

function sumByCategory(expenses) {
  const map = new Map();
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) || 0) + e.amount);
  }
  return map;
}

function renderMonthLabel() {
  $('#month-label').textContent = monthLabel(viewYear, viewMonth);
}

function renderStats() {
  const monthExpenses = expensesForMonth(viewYear, viewMonth);
  const total = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === viewYear && today.getMonth() + 1 === viewMonth;
  const elapsedDays = isCurrentMonth ? today.getDate() : daysInMonth(viewYear, viewMonth);
  const avgPerDay = elapsedDays > 0 ? total / elapsedDays : 0;

  const [prevYear, prevMonth] = shiftMonth(viewYear, viewMonth, -1);
  const prevTotal = expensesForMonth(prevYear, prevMonth).reduce((s, e) => s + e.amount, 0);

  $('#stat-total').textContent = formatMoney(total);
  $('#stat-avg').textContent = formatMoney(avgPerDay);

  const changeEl = $('#stat-change');
  changeEl.classList.remove('stat-change--up', 'stat-change--down');
  if (prevTotal === 0) {
    changeEl.textContent = total > 0 ? '—' : '0 %';
  } else {
    const pct = ((total - prevTotal) / prevTotal) * 100;
    const sign = pct > 0 ? '+' : '';
    changeEl.textContent = `${sign}${pct.toFixed(0)} %`;
    if (pct > 0) changeEl.classList.add('stat-change--up');
    if (pct < 0) changeEl.classList.add('stat-change--down');
  }
}

function renderDoughnut() {
  const monthExpenses = expensesForMonth(viewYear, viewMonth);
  const byCategory = sumByCategory(monthExpenses);
  const rows = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  const canvas = $('#chart-categories');
  const emptyState = $('#chart-categories-empty');

  if (doughnutChart) {
    doughnutChart.destroy();
    doughnutChart = null;
  }

  if (rows.length === 0) {
    $('#category-legend').innerHTML = '';
    emptyState.classList.remove('hidden');
    canvas.classList.add('hidden');
    return;
  }
  canvas.classList.remove('hidden');
  emptyState.classList.add('hidden');

  const labels = rows.map(([id]) => categoryMap.get(id)?.label ?? id);
  const data = rows.map(([, amount]) => amount);
  const colors = rows.map(([id]) => categoryMap.get(id)?.color ?? CHART.muted);

  doughnutChart = new Chart(canvas, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
    options: baseChartOptions({
      cutout: '68%',
      plugins: { legend: { display: false } },
      scales: {},
    }),
  });

  const total = data.reduce((s, v) => s + v, 0);
  $('#category-legend').innerHTML = rows
    .map(([id, amount]) => {
      const cat = categoryMap.get(id) || { label: id, color: CHART.muted };
      const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
      return `
        <div class="legend-row">
          <span class="legend-dot" style="background:${cat.color}"></span>
          <span class="legend-label">${cat.label}</span>
          <span class="legend-pct">${pct}%</span>
          <span class="legend-amount">${formatMoney(amount)}</span>
        </div>`;
    })
    .join('');
}

function renderTrend() {
  const months = [];
  for (let i = 5; i >= 0; i -= 1) {
    months.push(shiftMonth(viewYear, viewMonth, -i));
  }

  const labels = months.map(([y, m]) => shortMonthLabel(y, m));
  const data = months.map(([y, m]) => expensesForMonth(y, m).reduce((s, e) => s + e.amount, 0));

  const canvas = $('#chart-trend');
  if (trendChart) {
    trendChart.destroy();
    trendChart = null;
  }

  trendChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data, backgroundColor: CHART.accent, borderRadius: 6, maxBarThickness: 32 }],
    },
    options: baseChartOptions({
      plugins: { legend: { display: false } },
    }),
  });
}

function render() {
  renderMonthLabel();
  renderStats();
  renderDoughnut();
  renderTrend();
}

function setupMonthNav() {
  $('#btn-prev-month').addEventListener('click', () => {
    [viewYear, viewMonth] = shiftMonth(viewYear, viewMonth, -1);
    render();
  });
  $('#btn-next-month').addEventListener('click', () => {
    [viewYear, viewMonth] = shiftMonth(viewYear, viewMonth, 1);
    render();
  });
}

async function init() {
  const today = new Date();
  viewYear = today.getFullYear();
  viewMonth = today.getMonth() + 1;

  setupMonthNav();
  allExpenses = await getAllExpenses();
  render();
}

init();
