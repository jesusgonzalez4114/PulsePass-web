import { http, consulta } from '../../lib/http';
import { ArtistaSchema } from './tipos';
export const activos = (signal?: AbortSignal) =>
    http('/artists/active', ArtistaSchema.array(), { signal });
export const artista = (id: number, signal?: AbortSignal) =>
    http(`/artists/${id}`, ArtistaSchema, { signal });
export const porNombre = (name: string, signal?: AbortSignal) =>
    http(`/artists/by-stage-name?${consulta('stageName', name)}`, ArtistaSchema, {
        signal,
    });
