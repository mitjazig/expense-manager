let workerPromise = null;

function getWorker() {
  if (!workerPromise) {
    workerPromise = window.Tesseract.createWorker('eng');
  }
  return workerPromise;
}

function parseAmount(text) {
  const numberRe = /(\d{1,4}[.,]\d{2})/g;
  const keywordRe = /skupaj|total|za pla|znesek|placilo|plačilo|eur/i;

  const keywordCandidates = [];
  const allCandidates = [];

  for (const line of text.split('\n')) {
    const matches = [...line.matchAll(numberRe)].map((m) => parseFloat(m[1].replace(',', '.')));
    if (matches.length === 0) continue;
    allCandidates.push(...matches);
    if (keywordRe.test(line)) keywordCandidates.push(...matches);
  }

  const pool = keywordCandidates.length > 0 ? keywordCandidates : allCandidates;
  if (pool.length === 0) return null;
  return Math.max(...pool);
}

export async function recognizeAmount(blob) {
  const worker = await getWorker();
  const { data } = await worker.recognize(blob);
  return parseAmount(data.text);
}
