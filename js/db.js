const DB_NAME = 'expense-manager';
const DB_VERSION = 1;
const STORE = 'expenses';

let dbPromise = null;

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('date', 'date');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function addExpense(expense) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const id = await reqToPromise(tx.objectStore(STORE).add(expense));
  return id;
}

export async function updateExpense(id, expense) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  await reqToPromise(tx.objectStore(STORE).put({ ...expense, id }));
}

export async function deleteExpense(id) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  await reqToPromise(tx.objectStore(STORE).delete(id));
}

export async function getAllExpenses() {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readonly');
  return reqToPromise(tx.objectStore(STORE).getAll());
}

export async function importExpenses(records) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  for (const record of records) {
    const { id, ...rest } = record;
    store.add(rest);
  }
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
