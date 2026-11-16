import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { server, reset } from './fixtures';
import { guardarSesion } from '../lib/sesionStore';
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
    sessionStorage.clear();
    guardarSesion(null);
    reset();
});
afterEach(() => {
    cleanup();
    server.resetHandlers();
    vi.restoreAllMocks();
    guardarSesion(null);
});
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: () => ({
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {},
    }),
});
// JSDOM no implementa estos métodos. El foco real se verifica manualmente.
HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
};
