import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { app } from './render';
import {
  base,
  server,
  fallo,
  evento,
  artista,
  sede,
  ticket,
  usuario,
  peticiones,
} from './fixtures';
import { RUTAS as R } from '../lib/rutas';
import type { Rol } from '../lib/validacion';

interface Vista {
  ruta: string;
  api: string;
  rol?: Rol;
  exito: () => Promise<HTMLElement>;
}

const enlace = (name: string) => () => screen.findByRole('link', { name });
const titulo = (name: string) => () => screen.findByRole('heading', { name });

const vistas: Vista[] = [
  { ruta: R.inicio, api: '/events/published', exito: enlace(evento.name) },
  { ruta: R.eventos, api: '/events/published', exito: enlace(evento.name) },
  {
    ruta: R.evento(evento.eventCode),
    api: '/events/:code',
    exito: titulo(evento.name),
  },
  {
    ruta: R.artistas,
    api: '/artists/active',
    exito: enlace(artista.stageName),
  },
  { ruta: R.artista(1), api: '/artists/1', exito: titulo(artista.stageName) },
  { ruta: R.sedes, api: '/venues/active', exito: enlace(sede.name) },
  { ruta: R.sede(sede.code), api: '/venues/:code', exito: titulo(sede.name) },
  {
    ruta: R.cuenta,
    api: '/users/by-email',
    rol: 'USER',
    exito: titulo('Andrea Ruiz'),
  },
  {
    ruta: R.tickets,
    api: '/tickets/by-user',
    rol: 'USER',
    exito: titulo(evento.name),
  },
  {
    ruta: R.confirmacion(ticket.ticketCode),
    api: '/tickets/:code',
    rol: 'USER',
    exito: titulo(evento.name),
  },
  {
    ruta: R.ticket(ticket.ticketCode),
    api: '/tickets/:code',
    rol: 'USER',
    exito: titulo(evento.name),
  },
  {
    ruta: R.pagados(evento.eventCode),
    api: '/events/:code/tickets/paid',
    rol: 'STAFF',
    exito: () => screen.findByRole('table'),
  },
  {
    ruta: R.gestion(evento.eventCode),
    api: '/events/:code',
    rol: 'ADMIN',
    exito: titulo(evento.name),
  },
];

describe.each(vistas)('$ruta', ({ ruta, api, rol, exito }) => {
  test('muestra la espera y después los datos del recurso', async () => {
    let liberar!: () => void;
    let solicitada!: () => void;
    const solicitud = new Promise<void>((resolve) => {
      solicitada = resolve;
    });
    const espera = new Promise<void>((resolve) => {
      liberar = resolve;
    });
    server.use(
      http.get(
        base + api,
        async () => {
          solicitada();
          await espera;
        },
        { once: true },
      ),
    );
    app(ruta, rol ? [rol] : null);
    try {
      await solicitud;
      expect((await screen.findAllByText('Cargando…')).length).toBeGreaterThan(0);
    } finally {
      liberar();
    }
    expect(await exito()).toBeVisible();
  });

  test('permite recuperar los datos tras un error 500', async () => {
    server.use(http.get(base + api, () => fallo(500), { once: true }));
    app(ruta, rol ? [rol] : null);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ocurrió un error inesperado',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await exito()).toBeVisible();
  });
});

test.each([
  [R.inicio, '/events/published'],
  [R.artistas, '/artists/active'],
  [R.sedes, '/venues/active'],
  [R.artista(1), '/events/by-artist'],
])('comunica la ausencia de resultados en %s', async (ruta, api) => {
  server.use(http.get(base + api, () => HttpResponse.json([])));
  app(ruta!);
  expect(await screen.findByText('No hay resultados.')).toBeVisible();
});

test.each(['0', '-1', '1.5', '9007199254740992'])(
  'rechaza el ID de artista %s antes de consultar',
  async (id) => {
    app('/artistas/' + id);
    await titulo('404')();
    expect(peticiones.some((p) => p.path.startsWith('/api/artists/'))).toBe(false);
  },
);

test('la cuenta usa ambos identificadores de la sesión autenticada', async () => {
  const urls: URL[] = [];
  server.use(
    ...['by-email', 'by-username'].map((operacion) =>
      http.get(base + '/users/' + operacion, ({ request }) => {
        expect(request.headers.get('Authorization')).toBe('Bearer fake-token');
        urls.push(new URL(request.url));
        return HttpResponse.json(usuario);
      }),
    ),
  );
  app(R.cuenta, ['USER']);
  await titulo('Andrea Ruiz')();
  await screen.findByText('andrea · andrea@example.test');
  expect(urls.map((u) => u.searchParams.toString())).toEqual(
    expect.arrayContaining(['email=andrea%40example.test', 'username=andrea']),
  );
});

test('el perfil del artista sigue visible si fallan sus eventos', async () => {
  server.use(http.get(base + '/events/by-artist', () => fallo(500)));
  app(R.artista(1));
  await screen.findByRole('alert');
  expect(await titulo(artista.stageName)()).toBeVisible();
});

test('un detalle sin artistas informa del estado vacío', async () => {
  server.use(
    http.get(base + '/events/:code', () =>
      HttpResponse.json({ ...evento, artists: [] }),
    ),
  );
  app(R.evento(evento.eventCode));
  expect(await screen.findByText('Sin artistas asociados.')).toBeVisible();
});

test('inicio ordena los eventos por fecha y enlaza únicamente los tres primeros', async () => {
  const eventos = [4, 1, 3, 2].map((dia) => ({
    ...evento,
    eventCode: 'EV-' + dia,
    name: 'Concierto ' + dia,
    eventDate: '2030-01-0' + dia + 'T20:00:00',
  }));
  server.use(
    http.get(base + '/events/published', () => HttpResponse.json(eventos)),
    http.get(base + '/events/:code', ({ params }) => {
      const detalle = eventos.find((e) => e.eventCode === params.code);
      return detalle ? HttpResponse.json(detalle) : fallo(404);
    }),
  );
  app(R.inicio);
  const enlaces = await screen.findAllByRole('link', { name: /^Concierto / });
  expect(enlaces.map((e) => e.textContent)).toEqual([
    'Concierto 1',
    'Concierto 2',
    'Concierto 3',
  ]);
  expect(enlaces.map((e) => e.getAttribute('href'))).toEqual(
    [1, 2, 3].map((dia) => R.evento('EV-' + dia)),
  );
});

test('la búsqueda exacta de artistas conserva espacios y caracteres especiales en la petición', async () => {
  const nombre = 'Sol & Mar';
  let consulta: string | null = null;
  server.use(
    http.get(base + '/artists/by-stage-name', ({ request }) => {
      consulta = new URL(request.url).searchParams.get('stageName');
      return HttpResponse.json({ ...artista, id: 2, stageName: nombre });
    }),
  );
  app(R.artistas);
  await userEvent.click(
    await screen.findByText('Buscar por nombre artístico exacto'),
  );
  await userEvent.type(screen.getByLabelText('Nombre artístico'), nombre);
  await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
  expect(await screen.findByRole('link', { name: nombre })).toHaveAttribute(
    'href',
    R.artista(2),
  );
  expect(consulta).toBe(nombre);
});

test('un artista inexistente informa del 404 sin consultar sus eventos', async () => {
  server.use(http.get(base + '/artists/1', () => fallo(404)));
  app(R.artista(1));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Artista no disponible',
  );
  expect(peticiones.some((p) => p.path === '/api/events/by-artist')).toBe(false);
});

test('un código de sede de más de 255 caracteres abre 404 sin consultar la API', async () => {
  app(R.sede('x'.repeat(256)));
  await screen.findByRole('heading', { name: '404' });
  expect(peticiones.some((p) => p.path.startsWith('/api/venues/'))).toBe(false);
});

test('cartelera ignora una categoría desconocida y conserva la búsqueda al abrir un enlace', async () => {
  const { router } = app(R.eventos + '?categoria=INVENTADA&q=CARIBBEAN');
  expect(await screen.findByRole('link', { name: evento.name })).toBeVisible();
  expect(screen.getByLabelText('Categoría')).toHaveValue('');
  expect(screen.getByLabelText('Buscar por nombre')).toHaveValue('CARIBBEAN');
  await userEvent.clear(screen.getByLabelText('Buscar por nombre'));
  expect(new URLSearchParams(router.state.location.search).has('q')).toBe(false);
});

test('al limpiar un filtro de artista sin coincidencias se recupera la cartelera', async () => {
  server.use(http.get(base + '/events/by-artist', () => HttpResponse.json([])));
  const { router } = app(R.eventos + '?artista=Solar+Beat');
  await screen.findByText('No hay resultados.');
  await userEvent.click(
    screen.getByRole('button', { name: 'Limpiar filtros' }),
  );
  expect(await screen.findByRole('link', { name: evento.name })).toBeVisible();
  expect(router.state.location.search).toBe('');
});

test('la tarjeta enlaza un código con espacios y acentos y muestra sede, categoría y estado', async () => {
  const especial = { ...evento, eventCode: 'MÚSICA & SOL' };
  server.use(
    http.get(base + '/events/published', () => HttpResponse.json([especial])),
    http.get(base + '/events/:code', ({ params }) =>
      params.code === especial.eventCode
        ? HttpResponse.json(especial)
        : fallo(404),
    ),
  );
  app(R.eventos);
  expect(
    await screen.findByRole('link', { name: evento.name }),
  ).toHaveAttribute('href', '/eventos/M%C3%9ASICA%20%26%20SOL');
  expect(screen.getByText(evento.venueName)).toBeVisible();
  expect(screen.getByText('Música')).toBeVisible();
  expect(screen.getByText('PUBLISHED')).toBeVisible();
});

test('sin sedes activas se informa del estado vacío y se impide crear el evento', async () => {
  server.use(http.get(base + '/venues/active', () => HttpResponse.json([])));
  app(R.nuevo, ['ADMIN']);
  await screen.findByText('No hay resultados.');
  expect(screen.queryByRole('button', { name: 'Crear evento' })).toBeNull();
  expect(peticiones.some((p) => p.method === 'POST')).toBe(false);
});

test('la cartelera conserva los otros eventos cuando uno desaparece entre listado y detalle', async () => {
  server.use(
    http.get(base + '/events/published', () =>
      HttpResponse.json([
        evento,
        { ...evento, eventCode: 'RETIRADO', name: 'Evento retirado' },
      ]),
    ),
    http.get(base + '/events/RETIRADO', () => fallo(404)),
  );
  app(R.eventos);
  expect(await screen.findByRole('link', { name: evento.name })).toBeVisible();
  expect(screen.queryByRole('link', { name: 'Evento retirado' })).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
});