// setupTests.ts
// Vitest + RTL global test setup

import '@testing-library/jest-dom';

// You can extend expect here if needed
// Example: customMatchers, etc.

// Workaround for SVGElement.getBBox in JSDOM if needed by charts or icons
if (!(SVGElement as any).prototype.getBBox) {
  (SVGElement as any).prototype.getBBox = () => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
}

// Polyfill for scrollTo in jsdom
if (!window.scrollTo) {
  // @ts-ignore
  window.scrollTo = () => {};
}
