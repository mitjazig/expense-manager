import { recognizeAmount } from './ocr.js';

export function setupReceiptField({
  inputId,
  btnId,
  previewId,
  previewImgId,
  removeId,
  statusId,
  autoDetect = false,
  onAmountDetected,
}) {
  const $ = (id) => document.getElementById(id);
  const input = $(inputId);
  const btn = $(btnId);
  const preview = $(previewId);
  const previewImg = $(previewImgId);
  const removeBtn = $(removeId);
  const status = $(statusId);

  let blob = null;
  let objectUrl = null;

  function showPreview(b) {
    blob = b;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(b);
    previewImg.src = objectUrl;
    preview.classList.remove('hidden');
    btn.classList.add('hidden');
  }

  function clear() {
    blob = null;
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
    preview.classList.add('hidden');
    btn.classList.remove('hidden');
    status.classList.add('hidden');
    status.textContent = '';
    input.value = '';
  }

  btn.addEventListener('click', () => input.click());

  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    showPreview(file);

    if (autoDetect) {
      status.textContent = 'Prepoznavam znesek …';
      status.classList.remove('hidden');
      try {
        const amount = await recognizeAmount(file);
        if (amount != null) {
          status.textContent = `Zaznan znesek: ${amount.toFixed(2).replace('.', ',')} €`;
          onAmountDetected?.(amount);
        } else {
          status.textContent = 'Zneska ni bilo mogoče prepoznati.';
        }
      } catch {
        status.textContent = 'Prepoznavanje ni uspelo (preveri internetno povezavo).';
      }
    }
  });

  removeBtn.addEventListener('click', clear);

  return {
    getBlob: () => blob,
    setBlob: (b) => {
      if (b) showPreview(b);
      else clear();
    },
    clear,
  };
}
