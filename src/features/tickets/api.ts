import { http, segmento as e, consulta } from '../../lib/http';
import { TicketSchema, ComprarSchema, type Comprar } from './tipos';
export const comprar = (data: Comprar) =>
  http('/tickets', TicketSchema, {
    method: 'POST',
    body: ComprarSchema.parse(data),
  });
export const ticket = (code: string, signal?: AbortSignal) =>
  http(`/tickets/${e(code)}`, TicketSchema, { signal });
export const propios = (email: string, signal?: AbortSignal) =>
  http(`/tickets/by-user?${consulta('email', email)}`, TicketSchema.array(), {
    signal,
  });
export const pagados = (code: string, signal?: AbortSignal) =>
  http(`/events/${e(code)}/tickets/paid`, TicketSchema.array(), { signal });
export const cancelar = (code: string) =>
  http(`/tickets/${e(code)}/cancel`, TicketSchema, { method: 'PATCH' });
export const usar = (code: string) =>
  http(`/tickets/${e(code)}/use`, TicketSchema, { method: 'PATCH' });
