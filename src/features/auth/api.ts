import { http } from '../../lib/http';
import { UsuarioSchema } from '../usuarios/tipos';
import {
    LoginSchema,
    RegistroSchema,
    PrincipalSchema,
    TokenSchema,
    type Login,
    type Registro,
} from './tipos';
export const login = (data: Login) =>
    http('/auth/login', TokenSchema, {
        method: 'POST',
        body: LoginSchema.parse(data),
        publica: true,
    });
export const registro = (data: Registro) =>
    http('/users', UsuarioSchema, {
        method: 'POST',
        body: RegistroSchema.parse(data),
        publica: true,
    });
export const me = (signal?: AbortSignal) =>
    http('/auth/me', PrincipalSchema, { signal });
