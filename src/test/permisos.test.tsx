import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { app } from './render';
import { peticiones } from './fixtures';
import { RUTAS as R } from '../lib/rutas';
import type { Rol } from '../lib/validacion';

test.each([
  R.cuenta,
  R.confirmacion('T-1'),
  R.ticket('T-1'),
  R.validacion,
  R.pagados('E-1'),
  R.admin,
  R.nuevo,
  R.gestion('E-1'),
])('un visitante conserva el destino %s al ir al login', async (ruta) => {
  const { router } = app(ruta);
  await screen.findByRole('heading', { name: 'Inicia sesión' });
  expect(router.state.location.state).toMatchObject({ desde: ruta });
  expect(peticiones).toHaveLength(0);
});

test.each([
  ['USER', R.validacion],
  ['USER', R.pagados('EV-01')],
  ['USER', R.nuevo],
  ['USER', R.gestion('EV-01')],
  ['STAFF', R.nuevo],
  ['STAFF', R.gestion('EV-01')],
  ['STAFF', R.admin],
] as const)('%s no puede abrir directamente %s', async (rol, ruta) => {
  const { router } = app(ruta, [rol]);
  await screen.findByRole('heading', { name: '403' });
  expect(router.state.location.pathname).toBe(R.sinPermisos);
  expect(peticiones.every((p) => p.path === '/api/auth/me')).toBe(true);
});

test.each([null, 'USER', 'STAFF', 'ADMIN'] as const)(
  'el menú ofrece los destinos del perfil %s',
  async (rol: Rol | null) => {
    app(R.inicio, rol ? [rol] : null);
    const nav = within(await screen.findByRole('navigation'));
    if (rol) await nav.findByRole('link', { name: 'andrea' });
    for (const [nombre, visible] of [
      ['Mis tickets', rol === 'USER'],
      ['Validar ingreso', rol === 'STAFF' || rol === 'ADMIN'],
      ['Administrar eventos', rol === 'ADMIN'],
      ['Ingresar', !rol],
    ] as const)
      expect(Boolean(nav.queryByRole('link', { name: nombre }))).toBe(visible);
  },
);

test('Escape desde el menú devuelve el foco al botón', async () => {
  app(R.sedes);
  const boton = await screen.findByRole('button', { name: 'Abrir menú' });
  await userEvent.click(boton);
  screen.getByRole('link', { name: 'Eventos' }).focus();
  await userEvent.keyboard('{Escape}');
  expect(boton).toHaveAttribute('aria-expanded', 'false');
  expect(boton).toHaveFocus();
});

test('un cambio manual de tema actualiza el documento y persiste en la pestaña', async () => {
  app(R.sedes);
  await userEvent.click(
    await screen.findByRole('button', { name: 'Modo oscuro' }),
  );
  expect(document.documentElement).toHaveClass('dark');
  expect(sessionStorage.getItem('pulsepass.tema')).toBe('oscuro');
  await userEvent.click(screen.getByRole('button', { name: 'Modo claro' }));
  expect(document.documentElement).not.toHaveClass('dark');
});

test('al cambiar de página desde el menú, se cierra y marca el enlace activo', async () => {
  app(R.inicio);
  const abrir = await screen.findByRole('button', { name: 'Abrir menú' });
  await userEvent.click(abrir);
  const enlace = screen.getByRole('link', { name: 'Sedes' });
  await userEvent.click(enlace);
  await screen.findByRole('heading', { name: 'Sedes' });
  expect(abrir).toHaveAttribute('aria-expanded', 'false');
  expect(enlace).toHaveAttribute('aria-current', 'page');
});

test.each([
  ['oscuro', false, true],
  ['claro', true, false],
  ['desconocido', true, true],
] as const)(
  'al iniciar aplica la preferencia %s con tema de sistema oscuro=%s',
  async (guardado, sistema, oscuro) => {
    sessionStorage.setItem('pulsepass.tema', guardado);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      ...media,
      matches: sistema,
    });
    app(R.sedes);
    expect(
      await screen.findByRole('button', {
        name: oscuro ? 'Modo claro' : 'Modo oscuro',
      }),
    ).toHaveAttribute('aria-pressed', String(oscuro));
    await waitFor(() =>
      expect(document.documentElement.classList.contains('dark')).toBe(oscuro),
    );
  },
);