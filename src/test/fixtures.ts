import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { Rol } from '../lib/validacion';
import type { Evento } from '../features/eventos/tipos';
import type { Ticket } from '../features/tickets/tipos';
export const base = 'http://localhost:8080/api';
export const sede = {
    id: 1,
    code: 'VEN-01',
    name: 'Arena Santa Marta',
    city: 'Santa Marta',
    address: 'Calle 1',
    capacity: 500,
    active: true,
};
export const artista = {
    id: 1,
    stageName: 'Solar Beat',
    country: 'Colombia',
    genre: 'Electrónica',
    active: true,
};
export const evento: Evento = {
    id: 1,
    eventCode: 'EV-01',
    name: 'Caribbean Music Fest',
    description: 'Música en vivo',
    category: 'MUSIC',
    status: 'PUBLISHED',
    eventDate: '2030-12-12T20:00:00',
    minimumAge: 0,
    venueCode: sede.code,
    venueName: sede.name,
    artists: ['Solar Beat'],
};
export const ticket: Ticket = {
    id: 1,
    ticketCode: 'TKT-01',
    type: 'GENERAL',
    price: 250000,
    status: 'PAID',
    purchaseDate: '2026-01-01T12:00:00',
    userEmail: 'andrea@example.test',
    eventCode: 'EV-01',
    eventName: evento.name,
};
export const usuario = {
    id: 1,
    username: 'andrea',
    email: 'andrea@example.test',
    active: true,
    firstName: 'Andrea',
    lastName: 'Ruiz',
    city: 'Santa Marta',
};
export const principal = (roles: Rol[] = ['USER']) => ({
    id: usuario.id,
    username: usuario.username,
    email: usuario.email,
    roles,
});
export const fallo = (
    status: number,
    message = 'Regla de negocio',
    details: Record<string, string> = {},
) =>
    HttpResponse.json(
        {
            timestamp: '2026-01-01T12:00:00',
            status,
            error: 'Error',
            message,
            details,
        },
        { status },
    );
export let actualEvento: Evento;
export let actualTicket: Ticket;
export let peticiones: {
    method: string;
    path: string;
    body: unknown;
    auth: string | null;
}[] = [];
export function reset() {
    actualEvento = structuredClone(evento);
    actualTicket = structuredClone(ticket);
    peticiones = [];
}
const summary = () => ({
    eventCode: actualEvento.eventCode,
    name: actualEvento.name,
    eventDate: actualEvento.eventDate,
    status: actualEvento.status,
    venueName: actualEvento.venueName,
});
export const server = setupServer(
    http.get(`${base}/auth/me`, () => HttpResponse.json(principal())),
    http.post(`${base}/auth/login`, () =>
        HttpResponse.json({
            accessToken: 'fake-token',
            tokenType: 'Bearer',
            expiresIn: 900,
        }),
    ),
    http.post(`${base}/users`, () => HttpResponse.json(usuario, { status: 201 })),
    http.get(`${base}/users/by-email`, () => HttpResponse.json(usuario)),
    http.get(`${base}/users/by-username`, () => HttpResponse.json(usuario)),
    http.get(`${base}/venues/active`, () => HttpResponse.json([sede])),
    http.get(`${base}/venues/:code`, () => HttpResponse.json(sede)),
    http.get(`${base}/artists/active`, () => HttpResponse.json([artista])),
    http.get(`${base}/artists/by-stage-name`, () => HttpResponse.json(artista)),
    http.get(`${base}/artists/:id`, () => HttpResponse.json(artista)),
    http.get(`${base}/events/published`, () => HttpResponse.json([summary()])),
    http.get(`${base}/events/by-artist`, () => HttpResponse.json([summary()])),
    http.get(`${base}/events/:code/tickets/paid`, () =>
        HttpResponse.json(actualTicket.status === 'PAID' ? [actualTicket] : []),
    ),
    http.get(`${base}/events/:code`, () => HttpResponse.json(actualEvento)),
    http.post(`${base}/events`, async ({ request }) => {
        const body = await request.json();
        if (typeof body === 'object' && body)
            actualEvento = { ...actualEvento, ...body, status: 'DRAFT' };
        return HttpResponse.json(actualEvento, { status: 201 });
    }),
    http.patch(`${base}/events/:code/publish`, () => {
        actualEvento = { ...actualEvento, status: 'PUBLISHED' };
        return HttpResponse.json(actualEvento);
    }),
    http.post(`${base}/events/:code/artists/:id`, () => {
        if (actualEvento.artists.includes(artista.stageName))
            return fallo(409, 'Artista ya asociado');
        actualEvento = { ...actualEvento, artists: [artista.stageName] };
        return HttpResponse.json(actualEvento);
    }),
    http.get(`${base}/tickets/by-user`, () => HttpResponse.json([actualTicket])),
    http.get(`${base}/tickets/:code`, () => HttpResponse.json(actualTicket)),
    http.post(`${base}/tickets`, () =>
        HttpResponse.json(actualTicket, { status: 201 }),
    ),
    http.patch(`${base}/tickets/:code/cancel`, () => {
        actualTicket = { ...actualTicket, status: 'CANCELLED' };
        return HttpResponse.json(actualTicket);
    }),
    http.patch(`${base}/tickets/:code/use`, () => {
        if (actualTicket.status !== 'PAID')
            return fallo(409, 'Ticket ya utilizado');
        actualTicket = { ...actualTicket, status: 'USED' };
        return HttpResponse.json(actualTicket);
    }),
);
server.events.on('request:start', async ({ request }) => {
    let body: unknown = null;
    if (request.method === 'POST') {
        try {
            body = await request.clone().json();
        } catch {
            /* sin cuerpo */
        }
    }
    peticiones.push({
        method: request.method,
        path: new URL(request.url).pathname,
        body,
        auth: request.headers.get('Authorization'),
    });
});
