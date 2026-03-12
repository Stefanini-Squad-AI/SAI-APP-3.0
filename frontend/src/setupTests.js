import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor() {
    return undefined;
  }
  disconnect() {
    return undefined;
  }
  observe() {
    return undefined;
  }
  takeRecords() {
    return [];
  }
  unobserve() {
    return undefined;
  }
};
