import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { base, evento, ticket, server, fallo, peticiones } from './fixtures';
import { app } from './render';
import { RUTAS as R } from '../lib/rutas';

const click = async (name: string) =>
  userEvent.click(await screen.findByRole('button', { name }));

test.each(['CANCELLED', 'RESERVED'])(
  'un ticket %s conserva los datos y oculta la cancelación',
  async (status) => {
    server.use(
      http.get(base + '/tickets/:code', () =>
        HttpResponse.json({ ...ticket, status }),
      ),
    );
    app(R.ticket(ticket.ticketCode), ['USER']);
    await screen.findByText(status);
    expect(screen.getByText(ticket.ticketCode)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Cancelar ticket' }),
    ).toBeNull();
  },
);

test.each([403, 404])(
  'la confirmación protege los datos cuando el servidor devuelve %i',
  async (status) => {
    server.use(
      http.get(base + '/tickets/:code', () => fallo(status, ticket.userEmail)),
    );
    app(R.confirmacion(ticket.ticketCode), ['USER']);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ticket no disponible',
    );
    expect(screen.queryByText(ticket.userEmail)).toBeNull();
    expect(screen.queryByText(ticket.ticketCode)).toBeNull();
  },
);

test.each(['PAID', 'RESERVED', 'USED', 'CANCELLED'])(
  'abrir una confirmación directa muestra el estado real %s',
  async (status) => {
    server.use(
      http.get(base + '/tickets/:code', () =>
        HttpResponse.json({ ...ticket, status }),
      ),
    );
    app(R.confirmacion(ticket.ticketCode), ['USER']);
    expect(
      await screen.findByText(
        'Compra registrada. Estado actual: ' + status + '.',
      ),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Ver mis tickets' }),
    ).toHaveAttribute('href', R.tickets);
  },
);

test.each(['PUBLISHED', 'SOLD_OUT', 'FINISHED', 'CANCELLED'])(
  'ADMIN no puede volver a publicar un evento %s',
  async (status) => {
    server.use(
      http.get(base + '/events/:code', () =>
        HttpResponse.json({ ...evento, status }),
      ),
    );
    app(R.gestion(evento.eventCode), ['ADMIN']);
    const boton = await screen.findByRole('button', {
      name: 'Publicar evento',
    });
    expect(boton).toBeDisabled();
    await userEvent.click(boton);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(peticiones.some((p) => p.method === 'PATCH')).toBe(false);
  },
);

test.each(['DRAFT', 'CANCELLED', 'FINISHED'])(
  'impide iniciar la compra si el evento está %s',
  async (status) => {
    server.use(
      http.get(base + '/events/:code', () =>
        HttpResponse.json({ ...evento, status }),
      ),
    );
    app(R.evento(evento.eventCode), ['USER']);
    expect(
      await screen.findByRole('button', { name: 'Comprar entrada' }),
    ).toBeDisabled();
  },
);

test('reintenta una compra VIP después del conflicto y conserva la identidad de sesión', async () => {
  server.use(
    http.post(base + '/tickets', () => fallo(409, 'Inténtalo de nuevo'), {
      once: true,
    }),
  );
  const { router } = app(R.evento(evento.eventCode), ['USER']);
  await click('Comprar entrada');
  await userEvent.selectOptions(
    screen.getByLabelText('Tipo de entrada'),
    'VIP',
  );
  await click('Confirmar compra');
  expect(
    await within(screen.getByRole('dialog')).findByRole('alert'),
  ).toHaveTextContent('Inténtalo de nuevo');
  server.use(
    http.post(base + '/tickets', () =>
      HttpResponse.json({ ...ticket, type: 'VIP' }, { status: 201 }),
    ),
  );
  await click('Confirmar compra');
  await screen.findByRole('heading', { name: 'Confirmación de compra' });
  expect(router.state.location.pathname).toBe(
    R.confirmacion(ticket.ticketCode),
  );
  const compras = peticiones.filter(
    (p) => p.method === 'POST' && p.path === '/api/tickets',
  );
  expect(compras).toHaveLength(2);
  for (const compra of compras)
    expect(compra.body).toEqual({
      type: 'VIP',
      eventCode: evento.eventCode,
      userEmail: ticket.userEmail,
    });
});

test('volver desde el diálogo conserva la entrada sin enviar cancelación', async () => {
  app(R.ticket(ticket.ticketCode), ['USER']);
  await click('Cancelar ticket');
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Volver' }),
  );
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByText('PAID')).toBeVisible();
  expect(peticiones.some((p) => p.method === 'PATCH')).toBe(false);
});

test('tras un conflicto se puede reintentar la cancelación en el mismo diálogo', async () => {
  server.use(
    http.patch(base + '/tickets/:code/cancel', () => fallo(409, 'Reintentar'), {
      once: true,
    }),
  );
  app(R.ticket(ticket.ticketCode), ['USER']);
  await click('Cancelar ticket');
  await click('Confirmar cancelación');
  await within(screen.getByRole('dialog')).findByRole('alert');
  await click('Confirmar cancelación');
  expect(await screen.findByText('CANCELLED')).toBeVisible();
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('filtrar y volver a Todos reutiliza la lista del usuario', async () => {
  server.use(
    http.get(base + '/tickets/by-user', () =>
      HttpResponse.json([
        ticket,
        { ...ticket, ticketCode: 'USADO', status: 'USED' },
      ]),
    ),
  );
  app(R.tickets, ['USER']);
  await screen.findByText('USADO');
  await click('USED');
  expect(screen.queryByText(ticket.ticketCode)).toBeNull();
  await click('Todos');
  expect(await screen.findByText(ticket.ticketCode)).toBeVisible();
  expect(
    peticiones.filter((p) => p.path === '/api/tickets/by-user'),
  ).toHaveLength(1);
});

test('un 403 de la API de cuenta abre la página sin permisos', async () => {
  server.use(http.get(base + '/users/by-email', () => fallo(403)));
  const { router } = app(R.cuenta, ['USER']);
  await screen.findByRole('heading', { name: '403' });
  expect(router.state.location.pathname).toBe(R.sinPermisos);
});

test('el conflicto de uso conserva el ticket pagado en la tabla', async () => {
  server.use(
    http.patch(base + '/tickets/:code/use', () =>
      fallo(409, 'El ticket cambió'),
    ),
  );
  app(R.pagados(evento.eventCode), ['STAFF']);
  const tabla = within(await screen.findByRole('table'));
  await userEvent.click(
    tabla.getByRole('button', { name: 'Marcar como usado' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'El ticket cambió',
  );
  expect(
    within(screen.getByRole('table')).getByText(ticket.ticketCode),
  ).toBeVisible();
});

test('el menú permite cerrar el diálogo de publicación sin modificar el evento', async () => {
  server.use(
    http.get(base + '/events/:code', () =>
      HttpResponse.json({ ...evento, status: 'DRAFT' }),
    ),
  );
  app(R.gestion(evento.eventCode), ['ADMIN']);
  await click('Publicar evento');
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: /cerrar/i }),
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(screen.getByText('DRAFT')).toBeVisible();
  expect(peticiones.some((p) => p.method === 'PATCH')).toBe(false);
});

test.each([
  {
    nombre: 'compra',
    ruta: R.evento(evento.eventCode),
    abrir: 'Comprar entrada',
    aceptar: 'Confirmar compra',
    metodo: 'POST',
    path: '/tickets',
  },
  {
    nombre: 'cancelación',
    ruta: R.ticket(ticket.ticketCode),
    abrir: 'Cancelar ticket',
    aceptar: 'Confirmar cancelación',
    metodo: 'PATCH',
    path: '/tickets/' + ticket.ticketCode + '/cancel',
  },
])(
  'durante la $nombre bloquea el doble envío y el cierre hasta recibir respuesta',
  async ({ ruta, abrir, aceptar, metodo, path }) => {
    let liberar!: () => void;
    const pausa = new Promise<void>((resolve) => {
      liberar = resolve;
    });
    let envios = 0;
    const responder = async () => {
      envios++;
      await pausa;
      return HttpResponse.json({
        ...ticket,
        status: metodo === 'POST' ? 'PAID' : 'CANCELLED',
      });
    };
    server.use(
      metodo === 'POST'
        ? http.post(base + path, responder)
        : http.patch(base + path, responder),
    );
    app(ruta, ['USER']);
    await click(abrir);
    const dialogo = screen.getByRole('dialog');
    const confirmar = within(dialogo).getByRole('button', { name: aceptar });
    try {
      await userEvent.click(confirmar);
      await waitFor(() => expect(envios).toBe(1));
      expect(confirmar).toBeDisabled();
      const cerrar = within(dialogo).getByRole('button', {
        name: 'Cerrar diálogo',
      });
      expect(cerrar).toBeDisabled();
      await userEvent.click(confirmar);
      await userEvent.click(cerrar);
      expect(dialogo).toBeVisible();
    } finally {
      liberar();
    }
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(envios).toBe(1);
    expect(
      await screen.findByText(metodo === 'POST' ? 'PAID' : 'CANCELLED'),
    ).toBeVisible();
  },
);

test('la lista rechaza tickets con un estado desconocido y permite recuperar los datos', async () => {
  server.use(
    http.get(
      base + '/tickets/by-user',
      () => HttpResponse.json([{ ...ticket, status: 'DESCONOCIDO' }]),
      { once: true },
    ),
  );
  app(R.tickets, ['USER']);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'incompatible con el contrato',
  );
  expect(screen.queryByText(ticket.ticketCode)).toBeNull();
  await click('Reintentar');
  expect(await screen.findByText(ticket.ticketCode)).toBeVisible();
});