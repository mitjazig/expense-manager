import { CATEGORIES } from './config.js';
import { getAllExpenses, updateExpense, deleteExpense } from './db.js';
import { categoryIconSvg, iconSvg } from './icons.js';
import { showConfirm } from './dialogs.js';

const $ = (sel) => document.querySelector(sel);

const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]));

let allExpenses = [];
let editingId = null;
let selectCategory;

function formatMoney(amount) {
  return amount.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function dateToISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function firstDayOfMonth() {
  const d = new Date();
  return dateToISO(new Date(d.getFullYear(), d.getMonth(), 1));
}

function lastDayOfMonth() {
  const d = new Date();
  return dateToISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

function setupCategoryPicker() {
  const picker = $('#edit-category-picker');
  const hiddenInput = $('#edit-category');

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

function dayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const label = d.toLocaleDateString('sl-SI', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function confirmDelete(expense) {
  const cat = categoryMap.get(expense.category) || { label: expense.category };
  const desc = `${cat.label} · ${formatMoney(expense.amount)} · ${dayLabel(expense.date)}`;
  return showConfirm(desc, { title: 'Izbriši strošek?', icon: 'trash', tone: 'danger', confirmLabel: 'Izbriši' });
}

function filteredExpenses() {
  const from = $('#date-from').value;
  const to = $('#date-to').value;
  return allExpenses.filter((e) => e.date >= from && e.date <= to);
}

function renderSummary(list) {
  const total = list.reduce((sum, e) => sum + e.amount, 0);
  $('#range-total').textContent = formatMoney(total);
}

function renderList(list) {
  const listEl = $('#expense-list');
  const emptyState = $('#empty-state');

  if (list.length === 0) {
    listEl.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  const sorted = [...list].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt - a.createdAt;
  });

  const groups = new Map();
  for (const e of sorted) {
    if (!groups.has(e.date)) groups.set(e.date, []);
    groups.get(e.date).push(e);
  }

  listEl.innerHTML = [...groups.entries()]
    .map(([date, items]) => {
      const dayTotal = items.reduce((sum, e) => sum + e.amount, 0);
      const rows = items
        .map((e) => {
          const cat = categoryMap.get(e.category) || { label: e.category };
          return `
            <div class="expense-item${e.id === editingId ? ' expense-item--editing' : ''}" data-id="${e.id}">
              <span class="expense-item__icon">${categoryIconSvg(e.category)}</span>
              <div class="expense-item__info">
                <span class="expense-item__category">${cat.label}</span>
                ${e.note ? `<span class="expense-item__note">${escapeHtml(e.note)}</span>` : ''}
                ${e.location ? `<span class="expense-item__location">${iconSvg('pin')}${escapeHtml(e.location)}</span>` : ''}
              </div>
              <span class="expense-item__amount">${formatMoney(e.amount)}</span>
              <button type="button" class="expense-item__delete" data-delete="${e.id}" aria-label="Izbriši">×</button>
            </div>`;
        })
        .join('');
      return `
        <div class="day-group">
          <div class="day-group__header">
            <span>${dayLabel(date)}</span>
            <span>${formatMoney(dayTotal)}</span>
          </div>
          ${rows}
        </div>`;
    })
    .join('');
}

function render() {
  const list = filteredExpenses();
  renderSummary(list);
  renderList(list);
}

async function reload() {
  allExpenses = await getAllExpenses();
  render();
}

function exitEditMode() {
  editingId = null;
  $('#edit-panel').classList.add('hidden');
  $('#edit-form').reset();
}

function enterEditMode(expense) {
  editingId = expense.id;
  $('#edit-amount').value = expense.amount;
  $('#edit-date').value = expense.date;
  $('#edit-note').value = expense.note ?? '';
  $('#edit-location').value = expense.location ?? '';
  selectCategory(expense.category);
  $('#edit-panel').classList.remove('hidden');
  render();
  $('#edit-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setupEditForm() {
  selectCategory = setupCategoryPicker();

  $('#edit-btn-locate').addEventListener('click', () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        $('#edit-location').value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      },
      () => {},
      { timeout: 8000 },
    );
  });

  $('#btn-cancel-edit').addEventListener('click', () => exitEditMode());

  $('#edit-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!editingId) return;

    const amount = parseFloat($('#edit-amount').value);
    const category = $('#edit-category').value;
    const date = $('#edit-date').value;
    const note = $('#edit-note').value.trim();
    const location = $('#edit-location').value.trim();

    if (!Number.isFinite(amount) || amount <= 0 || !category || !date) return;

    const existing = allExpenses.find((e) => e.id === editingId);
    await updateExpense(editingId, {
      amount,
      category,
      date,
      note,
      location,
      createdAt: existing?.createdAt ?? Date.now(),
    });

    exitEditMode();
    await reload();
  });
}

function setupListActions() {
  $('#expense-list').addEventListener('click', async (event) => {
    const deleteBtn = event.target.closest('[data-delete]');
    if (deleteBtn) {
      const id = Number(deleteBtn.dataset.delete);
      const expense = allExpenses.find((e) => e.id === id);
      if (!expense) return;
      const confirmed = await confirmDelete(expense);
      if (!confirmed) return;
      if (editingId === id) exitEditMode();
      await deleteExpense(id);
      await reload();
      return;
    }

    const item = event.target.closest('.expense-item');
    if (!item) return;
    const id = Number(item.dataset.id);
    const expense = allExpenses.find((e) => e.id === id);
    if (expense) enterEditMode(expense);
  });
}

function setupFilters() {
  $('#date-from').value = firstDayOfMonth();
  $('#date-to').value = lastDayOfMonth();
  $('#date-from').addEventListener('change', render);
  $('#date-to').addEventListener('change', render);
}

async function init() {
  setupFilters();
  setupEditForm();
  setupListActions();
  await reload();
}

init();
