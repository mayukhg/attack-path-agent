// In-memory store for validation results, keyed by path_id.
// Next.js module caching keeps this alive across route handler calls
// within the same server process.

const store = new Map();          // path_id → PathValidationCallback payload
const listeners = new Map();      // path_id → Set of resolve callbacks

export function setValidationResult(pathId, payload) {
  store.set(pathId, payload);
  const waiting = listeners.get(pathId);
  if (waiting) {
    waiting.forEach(resolve => resolve(payload));
    listeners.delete(pathId);
  }
}

export function getValidationResult(pathId) {
  return store.get(pathId) || null;
}

export function waitForValidationResult(pathId, timeoutMs = 30000) {
  const existing = store.get(pathId);
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const set = listeners.get(pathId);
      if (set) set.delete(resolve);
      reject(new Error('Validation result timeout'));
    }, timeoutMs);

    const wrapped = (payload) => { clearTimeout(timer); resolve(payload); };
    if (!listeners.has(pathId)) listeners.set(pathId, new Set());
    listeners.get(pathId).add(wrapped);
  });
}
