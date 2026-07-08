import { iconSvg } from './icons.js';

function ensureModal() {
  if (document.getElementById('app-dialog')) return;

  const modal = document.createElement('div');
  modal.id = 'app-dialog';
  modal.className = 'confirm-modal hidden';
  modal.innerHTML = `
    <div class="confirm-modal__backdrop" data-action="cancel"></div>
    <div class="confirm-modal__panel" role="alertdialog" aria-labelledby="app-dialog-title">
      <span id="app-dialog-icon" class="confirm-modal__icon"></span>
      <h2 id="app-dialog-title" class="confirm-modal__title"></h2>
      <p id="app-dialog-desc" class="confirm-modal__desc"></p>
      <div class="confirm-modal__actions">
        <button type="button" id="app-dialog-cancel" class="btn btn--ghost" data-action="cancel">Prekliči</button>
        <button type="button" id="app-dialog-confirm" class="btn btn--primary" data-action="confirm">V redu</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function openDialog({ icon, tone, title, desc, cancelLabel, confirmLabel }) {
  ensureModal();
  const modal = document.getElementById('app-dialog');
  const iconEl = document.getElementById('app-dialog-icon');
  const cancelBtn = document.getElementById('app-dialog-cancel');
  const confirmBtn = document.getElementById('app-dialog-confirm');

  iconEl.innerHTML = iconSvg(icon);
  iconEl.classList.toggle('confirm-modal__icon--danger', tone === 'danger');
  iconEl.classList.toggle('confirm-modal__icon--accent', tone !== 'danger');

  document.getElementById('app-dialog-title').textContent = title;
  document.getElementById('app-dialog-desc').textContent = desc;
  confirmBtn.textContent = confirmLabel;
  confirmBtn.className = `btn ${tone === 'danger' ? 'btn--danger' : 'btn--primary'}`;

  if (cancelLabel) {
    cancelBtn.textContent = cancelLabel;
    cancelBtn.classList.remove('hidden');
  } else {
    cancelBtn.classList.add('hidden');
  }

  modal.classList.remove('hidden');

  return new Promise((resolve) => {
    function settle(result) {
      modal.classList.add('hidden');
      modal.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeydown);
      resolve(result);
    }
    function onClick(event) {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      settle(action === 'confirm');
    }
    function onKeydown(event) {
      if (event.key === 'Escape') settle(false);
    }
    modal.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeydown);
  });
}

export function showAlert(message, { title = 'Obvestilo', icon = 'alert', tone = 'accent', buttonLabel = 'V redu' } = {}) {
  return openDialog({ icon, tone, title, desc: message, cancelLabel: null, confirmLabel: buttonLabel });
}

export function showConfirm(
  message,
  { title = 'Ali si prepričan?', icon = 'trash', tone = 'danger', confirmLabel = 'Potrdi', cancelLabel = 'Prekliči' } = {},
) {
  return openDialog({ icon, tone, title, desc: message, cancelLabel, confirmLabel });
}
