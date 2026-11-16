import { http, segmento } from '../../lib/http';
import { SedeSchema } from './tipos';
export const activas = (signal?: AbortSignal) =>
    http('/venues/active', SedeSchema.array(), { signal });
export const sede = (code: string, signal?: AbortSignal) =>
    http(`/venues/${segmento(code)}`, SedeSchema, { signal });
