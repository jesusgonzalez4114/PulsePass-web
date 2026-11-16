import { http, segmento as e, consulta } from '../../lib/http';
import {
    EventoSchema,
    ResumenEventoSchema,
    CrearEventoSchema,
    type CrearEvento,
} from './tipos';
export const evento = (code: string, signal?: AbortSignal) =>
    http(`/events/${e(code)}`, EventoSchema, { signal });
export const publicados = (signal?: AbortSignal) =>
    http('/events/published', ResumenEventoSchema.array(), { signal });
export const porArtista = (name: string, signal?: AbortSignal) =>
    http(
        `/events/by-artist?${consulta('stageName', name)}`,
        ResumenEventoSchema.array(),
        { signal },
    );
export const crear = (data: CrearEvento) =>
    http('/events', EventoSchema, {
        method: 'POST',
        body: CrearEventoSchema.parse(data),
    });
export const publicar = (code: string) =>
    http(`/events/${e(code)}/publish`, EventoSchema, { method: 'PATCH' });
export const asociar = (data: { code: string; id: number }) =>
    http(`/events/${e(data.code)}/artists/${data.id}`, EventoSchema, {
        method: 'POST',
    });
