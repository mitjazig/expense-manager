import { CATEGORIES } from './config.js';
import { addExpense, getAllExpenses, importExpenses } from './db.js';
import { setupInstallUI } from './install-ui.js';
import { initPwaUpdates } from './pwa-update.js';
import { categoryIconSvg } from './icons.js';
import { showAlert, showConfirm } from './dialogs.js';
import { setupReceiptField } from './receipt.js';

const $ = (sel) => document.querySelector(sel);

const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]));

let allExpenses = [];
let viewYear;
let viewMonth; // 1-12

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatMoney(amount) {
  return amount.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function setupCategoryPicker() {
  const picker = $('#category-picker');
  const hiddenInput = $('#category');

  picker.innerHTML = CATEGORIES.map(
    (c) => `
      <button type="button" class="chip" data-category="${c.id}" style="--chip-color:${c.color}">
        <span class="chip__icon">${categoryIconSvg(c.id)}</span>
        <span class="chip__label">${c.label}</span>
      </button>`,
  ).join('');

  function select(id) {
    hiddenInput.value = id;
    picker.querySelectorAll('.chip').forEach((chip) => {
      chip.classList.toggle('chip--active', chip.dataset.category === id);
    });
  }

  picker.addEventListener('click', (event) => {
    const chip = event.target.closest('.chip');
    if (!chip) return;
    select(chip.dataset.category);
  });

  select(CATEGORIES[0].id);
  return select;
}

function monthLabel(year, month) {
  const d = new Date(year, month - 1, 1);
  const label = d.toLocaleDateString('sl-SI', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function expensesForMonth(year, month) {
  return allExpenses.filter((e) => {
    const [y, m] = e.date.split('-').map(Number);
    return y === year && m === month;
  });
}

function renderMonthLabel() {
  $('#month-label').textContent = monthLabel(viewYear, viewMonth);
}

function renderSummary(monthExpenses) {
  const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  $('#summary-total').textContent = formatMoney(total);

  const byCategory = new Map();
  for (const e of monthExpenses) {
    byCategory.set(e.category, (byCategory.get(e.category) || 0) + e.amount);
  }

  const rows = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const container = $('#summary-categories');

  container.innerHTML = rows
    .map(([catId, amount]) => {
      const cat = categoryMap.get(catId) || { label: catId, color: 'var(--muted)' };
      const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
      return `
        <div class="cat-row">
          <div class="cat-row__label">
            <span class="cat-row__dot" style="background:${cat.color}"></span>
            ${cat.label}
          </div>
          <div class="cat-row__bar"><div class="cat-row__bar-fill" style="width:${pct}%;background:${cat.color}"></div></div>
          <div class="cat-row__amount">${formatMoney(amount)}</div>
        </div>`;
    })
    .join('');
}

function render() {
  renderMonthLabel();
  const monthExpenses = expensesForMonth(viewYear, viewMonth);
  renderSummary(monthExpenses);
}

async function reload() {
  allExpenses = await getAllExpenses();
  render();
}

function setupForm() {
  const selectCategory = setupCategoryPicker();
  $('#date').value = todayISO();

  const receiptField = setupReceiptField({
    inputId: 'receipt-input',
    btnId: 'receipt-btn',
    previewId: 'receipt-preview',
    previewImgId: 'receipt-preview-img',
    removeId: 'receipt-remove',
    statusId: 'receipt-status',
    autoDetect: true,
    onAmountDetected: (amount) => {
      if (!$('#amount').value) $('#amount').value = amount.toFixed(2);
    },
  });

  $('#btn-locate').addEventListener('click', () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        $('#location').value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      },
      () => {},
      { timeout: 8000 },
    );
  });

  $('#expense-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const amount = parseFloat(form.amount.value);
    const category = form.category.value;
    const date = form.date.value;
    const note = form.note.value.trim();
    const location = form.location.value.trim();

    if (!Number.isFinite(amount) || amount <= 0 || !category || !date) return;

    const receiptImage = receiptField.getBlob();

    await addExpense({ amount, category, date, note, location, receiptImage, createdAt: Date.now() });

    form.reset();
    $('#date').value = date;
    selectCategory(CATEGORIES[0].id);
    receiptField.clear();

    const [y, m] = date.split('-').map(Number);
    viewYear = y;
    viewMonth = m;

    await reload();
  });
}

function setupMonthNav() {
  $('#btn-prev-month').addEventListener('click', () => {
    viewMonth -= 1;
    if (viewMonth < 1) {
      viewMonth = 12;
      viewYear -= 1;
    }
    render();
  });

  $('#btn-next-month').addEventListener('click', () => {
    viewMonth += 1;
    if (viewMonth > 12) {
      viewMonth = 1;
      viewYear += 1;
    }
    render();
  });
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function setupBackup() {
  $('#btn-export').addEventListener('click', async () => {
    const data = await getAllExpenses();
    const exportable = data.map(({ receiptImage, ...rest }) => rest);
    const stamp = todayISO();
    downloadJson(`moji-stroski-${stamp}.json`, exportable);
  });

  $('#btn-import').addEventListener('click', () => {
    $('#import-file').click();
  });

  $('#import-file').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('invalid format');

      const valid = parsed.filter(
        (r) => r && typeof r.amount === 'number' && typeof r.category === 'string' && typeof r.date === 'string',
      );
      if (valid.length === 0) {
        await showAlert('Datoteka ne vsebuje veljavnih stroškov.', { title: 'Neveljavna datoteka' });
        return;
      }
      const confirmed = await showConfirm(`Uvozim ${valid.length} stroškov iz datoteke?`, {
        title: 'Uvoz podatkov',
        icon: 'upload',
        tone: 'accent',
        confirmLabel: 'Uvozi',
      });
      if (!confirmed) return;

      await importExpenses(valid);
      await reload();
    } catch {
      await showAlert('Datoteke ni bilo mogoče prebrati. Preveri, da gre za veljaven izvoz JSON.', {
        title: 'Napaka pri uvozu',
      });
    }
  });
}

async function init() {
  const today = new Date();
  viewYear = today.getFullYear();
  viewMonth = today.getMonth() + 1;

  setupForm();
  setupMonthNav();
  setupBackup();
  setupInstallUI();
  initPwaUpdates();

  await reload();
}

init();
