import { http, consulta } from '../../lib/http';
import { UsuarioSchema } from './tipos';
export const porEmail = (email: string, signal?: AbortSignal) =>
    http(`/users/by-email?${consulta('email', email)}`, UsuarioSchema, {
        signal,
    });
export const porUsername = (username: string, signal?: AbortSignal) =>
    http(`/users/by-username?${consulta('username', username)}`, UsuarioSchema, {
        signal,
    });
