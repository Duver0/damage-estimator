import '@testing-library/jest-dom';

// localStorage mock — jsdom puede no tener .clear() en todas las versiones
const localStorageStore = {};
const localStorageMock = {
  getItem: (k) => localStorageStore[k] ?? null,
  setItem: (k, v) => { localStorageStore[k] = String(v); },
  removeItem: (k) => { delete localStorageStore[k]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); },
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
