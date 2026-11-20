import { vi } from 'vitest';

const key = 'pulsepass.sesion';
const ahora = new Date('2026-01-01T12:00:00Z').getTime();

async function restaurar() {
  vi.resetModules();
  return import('../lib/sesionStore');
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(ahora);
});

afterEach(() => vi.useRealTimers());

test.each([
  '{',
  '{}',
  'null',
  '{"token":42,"expiraEn":9}',
  '{"token":"","expiraEn":10}',
])('descarta una sesión dañada al arrancar: %s', async (raw) => {
  sessionStorage.setItem(key, raw);
  expect((await restaurar()).credencial()).toBeNull();
  expect(sessionStorage.getItem(key)).toBeNull();
});

test.each([-1, 0, 1])(
  'restaura únicamente una sesión posterior a la hora actual (%i ms)',
  async (delta) => {
    const c = { token: 'sesion-de-prueba', expiraEn: ahora + delta };
    sessionStorage.setItem(key, JSON.stringify(c));
    expect((await restaurar()).credencial()).toEqual(delta > 0 ? c : null);
    expect(sessionStorage.getItem(key) !== null).toBe(delta > 0);
  },
);

test('si el navegador bloquea la persistencia, se puede iniciar y cerrar sesión en memoria', async () => {
  const impedir = () => {
    throw new DOMException('Bloqueado', 'SecurityError');
  };
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(impedir);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(impedir);
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(impedir);
  const store = await restaurar();
  expect(store.credencial()).toBeNull();
  const c = { token: 'sesion-prueba', expiraEn: ahora + 30000 };
  store.guardarSesion(c);
  expect(store.credencial()).toEqual(c);
  store.guardarSesion(null);
  expect(store.credencial()).toBeNull();
});