import { screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { app } from './render';
import {
  base,
  server,
  fallo,
  peticiones,
  actualEvento,
  evento,
  ticket,
  artista,
  sede,
} from './fixtures';
import { credencial, guardarSesion } from '../lib/sesionStore';
import { RUTAS as R } from '../lib/rutas';

const click = async (name: string) =>
  userEvent.click(await screen.findByRole('button', { name }));

async function login() {
  await userEvent.type(
    await screen.findByLabelText('Usuario o correo'),
    'andrea',
  );
  await userEvent.type(
    screen.getByLabelText('Contraseña', { exact: true }),
    'Password1234!',
  );
  await click('Ingresar');
}

async function registro(password = 'Password1234!') {
  const campos = [
    ['Nombre de usuario', 'andrea'],
    ['Correo electrónico', 'andrea@example.test'],
    ['Nombres', 'Andrea'],
    ['Apellidos', 'Ruiz'],
    ['Fecha de nacimiento', '2000-01-01'],
    ['Contraseña (mínimo 12 caracteres)', password],
  ];
  for (const [label, value] of campos)
    await userEvent.type(await screen.findByLabelText(label!), value!);
  await click('Crear cuenta');
}

const posts = () => peticiones.filter((p) => p.method === 'POST');

test('AUTH-001 login válido vuelve a desde', async () => {
  const { router } = app(R.login, null, { desde: R.tickets });
  await login();
  await screen.findByRole('heading', { name: 'Mis tickets' });
  expect(router.state.location.pathname).toBe(R.tickets);
});

test('AUTH-002 401 muestra credenciales inválidas', async () => {
  server.use(http.post(`${base}/auth/login`, () => fallo(401)));
  app(R.login);
  await login();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Credenciales inválidas',
  );
});

test('AUTH-003 login vacío no hace petición', async () => {
  app(R.login);
  await click('Ingresar');
  expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
  expect(posts()).toHaveLength(0);
});

test('AUTH-004 contraseña corta no registra', async () => {
  app(R.registro);
  await registro('corta');
  expect(await screen.findByText('Mínimo 12 caracteres')).toBeVisible();
  expect(posts()).toHaveLength(0);
});

test('AUTH-005 registro redirige a login', async () => {
  app(R.registro);
  await registro();
  expect(
    await screen.findByText('Cuenta creada. Inicia sesión.'),
  ).toBeVisible();
});

test('AUTH-006 registro 409 oculta detalles internos', async () => {
  server.use(
    http.post(`${base}/users`, () => fallo(409, 'users_email_unique')),
  );
  app(R.registro);
  await registro();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'No se pudo registrar la cuenta',
  );
  expect(screen.queryByText('users_email_unique')).toBeNull();
});

test('AUTH-007 anónimo conserva ruta destino', async () => {
  const { router } = app(R.tickets);
  await screen.findByRole('heading', { name: 'Inicia sesión' });
  expect(router.state.location.state).toEqual({ desde: R.tickets });
});

test('AUTH-008 USER no entra en admin', async () => {
  app(R.admin, ['USER']);
  expect(await screen.findByRole('heading', { name: '403' })).toBeVisible();
});

test('AUTH-009 ADMIN entra en admin', async () => {
  app(R.admin, ['ADMIN']);
  expect(
    await screen.findByRole('heading', { name: 'Administración de eventos' }),
  ).toBeVisible();
});

test('AUTH-010 salir elimina credencial y datos privados', async () => {
  const { q } = app(R.cuenta, ['USER']);
  await screen.findByRole('heading', { name: 'Mi cuenta' });
  await screen.findByRole('heading', { name: 'Andrea Ruiz' });
  await click('Salir');
  await waitFor(() => expect(credencial()).toBeNull());
  expect(
    q.getQueryData(['usuario', 'email', 'andrea@example.test']),
  ).toBeUndefined();
  expect(sessionStorage.getItem('pulsepass.sesion')).toBeNull();
});

test('AUTH-011 credencial vencida regresa a anónimo', async () => {
  guardarSesion({ token: 'expired', expiraEn: Date.now() - 1000 });
  app(R.tickets);
  expect(
    await screen.findByRole('heading', { name: 'Inicia sesión' }),
  ).toBeVisible();
  await waitFor(() => expect(credencial()).toBeNull());
});

test('401 durante consulta limpia caché y redirige', async () => {
  server.use(http.get(`${base}/tickets/by-user`, () => fallo(401)));
  const { q } = app(R.tickets, ['USER']);
  await screen.findByRole('heading', { name: 'Inicia sesión' });
  expect(await screen.findByText('Tu sesión expiró')).toBeVisible();
  expect(
    q.getQueryData(['tickets', 'usuario', 'andrea@example.test']),
  ).toBeUndefined();
});

test('EVT-001 cartelera muestra eventos', async () => {
  app(R.eventos);
  expect(await screen.findByRole('link', { name: evento.name })).toBeVisible();
});

test('EVT-002 cartelera vacía', async () => {
  server.use(http.get(`${base}/events/published`, () => HttpResponse.json([])));
  app(R.eventos);
  expect(await screen.findByText('No hay resultados.')).toBeVisible();
});

test('EVT-003 filtros persisten en URL y usan categoría de detalle', async () => {
  const { router } = app(R.eventos);
  await screen.findByRole('link', { name: evento.name });
  await userEvent.type(screen.getByLabelText('Buscar por nombre'), 'Caribbean');
  await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'SPORTS');
  expect(router.state.location.search).toContain('categoria=SPORTS');
  expect(router.state.location.search).toContain('q=Caribbean');
  expect(screen.getByText('No hay resultados.')).toBeVisible();
});

test('EVT-004 detalle muestra artistas y sede', async () => {
  app(R.evento('EV-01'));
  expect(
    await screen.findByRole('heading', { name: evento.name }),
  ).toBeVisible();
  expect(await screen.findByRole('link', { name: 'Solar Beat' })).toBeVisible();
  expect(await screen.findByRole('link', { name: sede.name })).toBeVisible();
});

test('EVT-005 404 evento no disponible', async () => {
  server.use(http.get(`${base}/events/:code`, () => fallo(404)));
  app(R.evento('EV-01'));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Evento no disponible',
  );
});

test('EVT-006 SOLD_OUT deshabilita comprar cuando se recibe el DTO', async () => {
  server.use(
    http.get(`${base}/events/:code`, () =>
      HttpResponse.json({ ...evento, status: 'SOLD_OUT' }),
    ),
  );
  app(R.evento('EV-01'), ['USER']);
  expect(
    await screen.findByRole('button', { name: 'Comprar entrada' }),
  ).toBeDisabled();
});

test('ART-001 artistas activos', async () => {
  app(R.artistas);
  expect(
    await screen.findByRole('link', { name: artista.stageName }),
  ).toBeVisible();
});

test('ART-002 detalle con eventos', async () => {
  app(R.artista(1));
  expect(
    await screen.findByRole('heading', { name: artista.stageName }),
  ).toBeVisible();
  expect(await screen.findByRole('link', { name: evento.name })).toBeVisible();
});

test('ART-003 id inválido no llama endpoint de artista', async () => {
  app('/artistas/no-numero');
  await screen.findByRole('heading', { name: '404' });
  expect(peticiones.some((p) => p.path.startsWith('/api/artists/'))).toBe(
    false,
  );
});

test('VEN-001 lista y detalle de sede', async () => {
  app(R.sedes);
  await userEvent.click(await screen.findByRole('link', { name: sede.name }));
  expect(await screen.findByText('Capacidad: 500 personas')).toBeVisible();
});

test('VEN-001b sede 404', async () => {
  server.use(http.get(`${base}/venues/:code`, () => fallo(404)));
  app(R.sede('X'));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Sede no disponible',
  );
});

test('TKT-001 y TKT-004 compra envía email de sesión y va a confirmación', async () => {
  const { router, q } = app(R.evento('EV-01'), ['USER']);
  await click('Comprar entrada');
  await click('Confirmar compra');
  await screen.findByRole('heading', { name: 'Confirmación de compra' });
  expect(router.state.location.pathname).toBe(
    R.confirmacion(ticket.ticketCode),
  );
  expect(posts().find((p) => p.path === '/api/tickets')?.body).toEqual({
    eventCode: 'EV-01',
    userEmail: 'andrea@example.test',
    type: 'GENERAL',
  });
  expect(q.getQueryData(['ticket', 'TKT-01'])).toMatchObject({
    status: 'PAID',
  });
});

test('TKT-002 compra anónima lleva a login', async () => {
  const { router } = app(R.evento('EV-01'));
  await click('Comprar entrada');
  await screen.findByRole('heading', { name: 'Inicia sesión' });
  expect(router.state.location.state).toEqual({ desde: R.evento('EV-01') });
});

test('TKT-003 409 mantiene modal compra', async () => {
  server.use(
    http.post(`${base}/tickets`, () => fallo(409, 'No cumple la edad mínima')),
  );
  app(R.evento('EV-01'), ['USER']);
  await click('Comprar entrada');
  await click('Confirmar compra');
  const dialog = screen.getByRole('dialog');
  expect(await within(dialog).findByRole('alert')).toHaveTextContent(
    'No cumple la edad mínima',
  );
});

test('TKT-005 filtra tickets por estado', async () => {
  app(R.tickets, ['USER']);
  await screen.findByRole('heading', { name: evento.name });
  await click('USED');
  expect(screen.getByText('No hay resultados.')).toBeVisible();
});

test('TKT-006 lista de tickets vacía', async () => {
  server.use(http.get(`${base}/tickets/by-user`, () => HttpResponse.json([])));
  app(R.tickets, ['USER']);
  expect(await screen.findByText('No hay resultados.')).toBeVisible();
});

test('TKT-007 cancelar actualiza lista y caché', async () => {
  const { q } = app(R.tickets, ['USER']);
  await click('Cancelar ticket');
  await click('Confirmar cancelación');
  await waitFor(() =>
    expect(q.getQueryData(['ticket', 'TKT-01'])).toMatchObject({
      status: 'CANCELLED',
    }),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Cancelar ticket' }),
    ).toBeNull(),
  );
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('TKT-008 cancelar 409 conserva modal', async () => {
  server.use(
    http.patch(`${base}/tickets/:code/cancel`, () =>
      fallo(409, 'Ya no se puede cancelar'),
    ),
  );
  app(R.tickets, ['USER']);
  await click('Cancelar ticket');
  await click('Confirmar cancelación');
  expect(
    await within(screen.getByRole('dialog')).findByRole('alert'),
  ).toHaveTextContent('Ya no se puede cancelar');
});

test.each([403, 404])('TKT-009 ticket ajeno %s', async (status) => {
  server.use(http.get(`${base}/tickets/:code`, () => fallo(status)));
  app(R.ticket('TKT-01'), ['USER']);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Ticket no disponible',
  );
});

test('TKT-010 cancelar oculto si USED', async () => {
  server.use(
    http.get(`${base}/tickets/:code`, () =>
      HttpResponse.json({ ...ticket, status: 'USED' }),
    ),
  );
  app(R.ticket('TKT-01'), ['USER']);
  await screen.findByText('USED');
  expect(screen.queryByRole('button', { name: 'Cancelar ticket' })).toBeNull();
});

async function buscarIngreso() {
  await userEvent.type(
    await screen.findByLabelText('Código del ticket'),
    'TKT-01',
  );
  await userEvent.click(
    within(
      screen.getByLabelText('Código del ticket').closest('form')!,
    ).getByRole('button', { name: 'Buscar' }),
  );
  await screen.findByRole('heading', { name: evento.name });
}

test('STF-001 y STF-002 usar ticket y repetir produce 409', async () => {
  app(R.validacion, ['STAFF']);
  await buscarIngreso();
  await click('Marcar como usado');
  expect(await screen.findByText('Ingreso registrado.')).toBeVisible();
  await click('Marcar como usado');
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Ticket ya utilizado',
  );
});

test('STF-003 ticket inexistente', async () => {
  server.use(http.get(`${base}/tickets/:code`, () => fallo(404)));
  app(R.validacion, ['STAFF']);
  await userEvent.type(await screen.findByLabelText('Código del ticket'), 'X');
  await userEvent.click(
    within(
      screen.getByLabelText('Código del ticket').closest('form')!,
    ).getByRole('button', { name: 'Buscar' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Ticket no disponible',
  );
});

test('STF-004 tabla de pagados y eliminación tras usar', async () => {
  app(R.pagados('EV-01'), ['STAFF']);
  const table = await screen.findByRole('table');
  expect(within(table).getByText('TKT-01')).toBeVisible();
  await userEvent.click(
    within(table).getByRole('button', { name: 'Marcar como usado' }),
  );
  expect(await screen.findByText('No hay resultados.')).toBeVisible();
});

async function crearEvento() {
  await screen.findByRole('button', { name: 'Crear evento' });
  await userEvent.type(
    (await screen.findAllByLabelText('Código del evento')).at(-1)!,
    'NEW-01',
  );
  await userEvent.type(
    screen.getByLabelText('Nombre', { exact: true }),
    'Nuevo concierto',
  );
  await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'MUSIC');
  await userEvent.type(
    screen.getByLabelText('Fecha y hora local del evento'),
    '2030-12-12T20:00',
  );
  await userEvent.selectOptions(screen.getByLabelText('Sede'), 'VEN-01');
  await click('Crear evento');
}

test('ADM-001 formulario vacío no hace POST', async () => {
  app(R.nuevo, ['ADMIN']);
  await click('Crear evento');
  expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
  expect(posts()).toHaveLength(0);
});

test('ADM-002 crear lleva a gestión y recuerda código', async () => {
  const { router } = app(R.nuevo, ['ADMIN']);
  await crearEvento();
  await screen.findByRole('heading', { name: 'Gestionar evento' });
  expect(router.state.location.pathname).toBe(R.gestion('NEW-01'));
  expect(sessionStorage.getItem('pulsepass.eventos-recientes')).toContain(
    'NEW-01',
  );
});

test('ADM-003 400 asigna errores a campo', async () => {
  server.use(
    http.post(`${base}/events`, () =>
      fallo(400, 'Validación', { name: 'Nombre rechazado' }),
    ),
  );
  app(R.nuevo, ['ADMIN']);
  await crearEvento();
  expect(await screen.findByText('Nombre rechazado')).toBeVisible();
  expect(screen.getByLabelText('Nombre', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
});

async function publicar() {
  await click('Publicar evento');
  await click('Confirmar publicación');
}

test('ADM-004 publicar actualiza badge', async () => {
  server.use(
    http.get(`${base}/events/:code`, () =>
      HttpResponse.json({ ...evento, status: 'DRAFT' }),
    ),
  );
  app(R.gestion('EV-01'), ['ADMIN']);
  await publicar();
  expect(await screen.findByText('Evento publicado.')).toBeVisible();
  expect(screen.getByText('PUBLISHED')).toBeVisible();
});

test('ADM-005 publicar 409 conserva diálogo', async () => {
  server.use(
    http.get(`${base}/events/:code`, () =>
      HttpResponse.json({ ...evento, status: 'DRAFT' }),
    ),
    http.patch(`${base}/events/:code/publish`, () =>
      fallo(409, 'No se puede publicar'),
    ),
  );
  app(R.gestion('EV-01'), ['ADMIN']);
  await publicar();
  expect(
    await within(screen.getByRole('dialog')).findByRole('alert'),
  ).toHaveTextContent('No se puede publicar');
});

test('ADM-006 asociar muestra artista y duplicado 409', async () => {
  server.use(
    http.get(`${base}/events/:code`, () =>
      HttpResponse.json({ ...evento, artists: [] }),
    ),
    http.post(`${base}/events/:code/artists/:id`, () =>
      HttpResponse.json(evento),
    ),
  );
  app(R.gestion('EV-01'), ['ADMIN']);
  await userEvent.selectOptions(
    await screen.findByLabelText('Artista activo'),
    '1',
  );
  await click('Asociar artista');
  expect(await screen.findByText('Artista asociado.')).toBeVisible();
  expect(screen.getByRole('list')).toHaveTextContent('Solar Beat');
  server.use(
    http.post(`${base}/events/:code/artists/:id`, () =>
      fallo(409, 'Artista ya asociado'),
    ),
  );
  await click('Asociar artista');
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Artista ya asociado',
  );
});

test('GEN-001 ruta inexistente', async () => {
  app('/inexistente');
  expect(await screen.findByRole('heading', { name: '404' })).toBeVisible();
});

test.each([null, ['USER'], ['STAFF'], ['ADMIN']] as const)(
  'GEN-003 navbar según rol %s',
  async (roles) => {
    app(R.inicio, roles ? [...roles] : null);
    await screen.findByRole('heading', {
      name: 'Descubre los mejores eventos',
    });
    if (roles) await screen.findByRole('link', { name: 'andrea' });
    expect(
      screen.queryByRole('link', { name: 'Administrar eventos' }) !== null,
    ).toBe(roles?.includes('ADMIN' as never) ?? false);
  },
);

test('GEN-004 menú abre y cierra con teclado', async () => {
  app(R.inicio);
  const toggle = await screen.findByRole('button', { name: 'Abrir menú' });
  toggle.focus();
  await userEvent.keyboard('{Enter}');
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await userEvent.keyboard('{Enter}');
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('modal cancela con escape y no modifica API', async () => {
  app(R.tickets, ['USER']);
  await click('Cancelar ticket');
  const dialog = screen.getByRole('dialog');
  act(() => {
    dialog.dispatchEvent(
      new Event('cancel', { bubbles: true, cancelable: true }),
    );
  });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(peticiones.some((p) => p.method === 'PATCH')).toBe(false);
});

test('estado de carga antes de respuesta', async () => {
  server.use(
    http.get(`${base}/venues/active`, async () => {
      await delay(200);
      return HttpResponse.json([sede]);
    }),
  );
  app(R.sedes);
  expect(await screen.findByText('Cargando…')).toBeVisible();
  expect(await screen.findByRole('link', { name: sede.name })).toBeVisible();
});

test('error de carga permite reintentar', async () => {
  server.use(http.get(`${base}/venues/active`, () => fallo(500)));
  app(R.sedes);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Ocurrió un error inesperado',
  );
  server.use(
    http.get(`${base}/venues/active`, () => HttpResponse.json([sede])),
  );
  await click('Reintentar');
  expect(await screen.findByRole('link', { name: sede.name })).toBeVisible();
});

test('el formulario de registro acepta una contraseña de exactamente 72 bytes UTF-8', async () => {
  const password = 'é'.repeat(36);
  app(R.registro);
  await registro(password);
  await screen.findByText('Cuenta creada. Inicia sesión.');
  expect(posts().map((p) => p.body)).toEqual([
    expect.objectContaining({ password }),
  ]);
});

test('el registro indica el límite y evita el POST al superar los 72 bytes UTF-8', async () => {
  app(R.registro);
  await registro('é'.repeat(36) + 'a');
  expect(await screen.findByText('Máximo 72 bytes UTF-8')).toBeVisible();
  expect(posts()).toHaveLength(0);
});

test('ADMIN crea un borrador, asocia el artista y lo publica en la cartelera', async () => {
  actualEvento.artists = [];
  server.use(
    http.get(base + '/events/published', () =>
      HttpResponse.json(
        actualEvento.status === 'PUBLISHED' ? [actualEvento] : [],
      ),
    ),
  );
  const { router } = app(R.nuevo, ['ADMIN']);
  await crearEvento();
  await screen.findByText('DRAFT');
  await userEvent.selectOptions(
    await screen.findByLabelText('Artista activo'),
    '1',
  );
  await click('Asociar artista');
  await screen.findByText('Artista asociado.');
  expect(screen.getByRole('list')).toHaveTextContent(artista.stageName);
  await publicar();
  await screen.findByText('PUBLISHED');
  await act(() => router.navigate(R.eventos));
  expect(
    await screen.findByRole('link', { name: 'Nuevo concierto' }),
  ).toHaveAttribute('href', R.evento('NEW-01'));
});

test('mostrar y ocultar la contraseña conserva el valor sin enviar el login', async () => {
  app(R.login);
  const campo = await screen.findByLabelText('Contraseña', { exact: true });
  await userEvent.type(campo, 'ejemplo-local');
  await click('Mostrar contraseña');
  expect(campo).toHaveAttribute('type', 'text');
  await click('Ocultar contraseña');
  expect(campo).toHaveAttribute('type', 'password');
  expect(campo).toHaveValue('ejemplo-local');
  expect(posts()).toHaveLength(0);
});

test('registro asocia el error 400 del backend al campo que hay que corregir', async () => {
  server.use(
    http.post(base + '/users', () =>
      fallo(400, 'Validación', { email: 'Revisa tu correo' }),
    ),
  );
  app(R.registro);
  await registro();
  await screen.findByText('Revisa tu correo');
  const correo = screen.getByLabelText('Correo electrónico');
  expect(correo).toHaveAccessibleDescription('Revisa tu correo');
  expect(correo).toHaveAttribute('aria-invalid', 'true');
  expect(correo).toHaveValue('andrea@example.test');
});

test('un código de evento duplicado mantiene el formulario y los datos para corregirlo', async () => {
  server.use(
    http.post(base + '/events', () => fallo(409, 'El código ya existe')),
  );
  const { router } = app(R.nuevo, ['ADMIN']);
  await crearEvento();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'El código ya existe',
  );
  expect(screen.getByLabelText('Nombre', { exact: true })).toHaveValue(
    'Nuevo concierto',
  );
  expect(router.state.location.pathname).toBe(R.nuevo);
});