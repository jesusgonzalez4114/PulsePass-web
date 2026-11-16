import { z } from 'zod';
import {
    Codigo,
    EstadoTicket,
    FechaHora,
    TipoTicket,
} from '../../lib/validacion';
export const TicketSchema = z.object({
    id: z.number().int().positive(),
    ticketCode: Codigo,
    type: TipoTicket,
    price: z.number().nonnegative(),
    status: EstadoTicket,
    purchaseDate: FechaHora,
    userEmail: z.email(),
    eventCode: Codigo,
    eventName: z.string(),
});
export const CompraSchema = z.object({ type: TipoTicket });
export const ComprarSchema = CompraSchema.extend({
    userEmail: z.email(),
    eventCode: Codigo,
});
export type Ticket = z.infer<typeof TicketSchema>;
export type Comprar = z.infer<typeof ComprarSchema>;
