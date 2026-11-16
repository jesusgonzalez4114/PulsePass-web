import { z } from 'zod';
import {
    Categoria,
    Codigo,
    EstadoEvento,
    FechaHora,
    Texto,
} from '../../lib/validacion';
export const ResumenEventoSchema = z.object({
    eventCode: Codigo,
    name: Texto,
    eventDate: FechaHora,
    status: EstadoEvento,
    venueName: Texto,
});
export const EventoSchema = ResumenEventoSchema.extend({
    id: z.number().int().positive(),
    description: z.string().nullable(),
    category: Categoria,
    minimumAge: z.number().int().nonnegative(),
    venueCode: Codigo,
    artists: z.array(z.string()),
});
export const CrearEventoSchema = z.object({
    eventCode: Codigo,
    name: Texto,
    description: z.string().max(1000),
    category: Categoria,
    eventDate: FechaHora,
    minimumAge: z.number().int().nonnegative('Debe ser mayor o igual que cero'),
    venueCode: Codigo,
});
export type Evento = z.infer<typeof EventoSchema>;
export type CrearEvento = z.infer<typeof CrearEventoSchema>;
