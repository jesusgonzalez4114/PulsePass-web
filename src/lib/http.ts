import { z } from 'zod';
import { credencial } from './sesionStore';
const ErrorSchema = z.object({
    timestamp: z.string(),
    status: z.number().int(),
    error: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.string()).nullable(),
});
export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public details: Record<string, string> = {},
    ) {
        super(message);
        this.name = 'ApiError';
    }
}
const mensajes: Record<number, string> = {
    0: 'No pudimos conectar con el servidor.',
    400: 'Revisa los datos ingresados.',
    401: 'Tu sesión expiró.',
    403: 'No tienes permisos para esta operación.',
    404: 'Recurso no disponible.',
    409: 'No se pudo completar la operación.',
    500: 'Ocurrió un error inesperado. Inténtalo más tarde.',
    502: 'Respuesta del servidor incompatible con el contrato.',
};
export const mensaje = (e: unknown) =>
    e instanceof ApiError
        ? e.message
        : 'Ocurrió un error inesperado. Inténtalo más tarde.';
const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
interface Opciones {
    method?: 'GET' | 'POST' | 'PATCH';
    body?: unknown;
    signal?: AbortSignal;
    publica?: boolean;
}
export async function http<T>(
    path: string,
    schema: z.ZodType<T>,
    options: Opciones = {},
): Promise<T> {
    const token = options.publica ? undefined : credencial()?.token;
    let response: Response;
    try {
        response = await fetch(base + path, {
            method: options.method || 'GET',
            signal: options.signal,
            headers: {
                Accept: 'application/json',
                ...(options.body === undefined
                    ? {}
                    : { 'Content-Type': 'application/json' }),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body:
                options.body === undefined ? undefined : JSON.stringify(options.body),
        });
    } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') throw e;
        throw new ApiError(0, mensajes[0]!);
    }
    let data: unknown;
    try {
        data = await response.json();
    } catch {
        data = null;
    }
    if (!response.ok) {
        if (
            response.status === 401 &&
            !options.publica &&
            token &&
            token === credencial()?.token
        )
            window.dispatchEvent(new Event('pulsepass:401'));
        const parsed = ErrorSchema.safeParse(data);
        const message =
            response.status === 401 && path === '/auth/login'
                ? 'Credenciales inválidas'
                : response.status === 409 && parsed.success
                    ? parsed.data.message
                    : mensajes[response.status] || mensajes[500]!;
        throw new ApiError(
            response.status,
            message,
            response.status === 400 && parsed.success
                ? parsed.data.details || {}
                : {},
        );
    }
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw new ApiError(502, mensajes[502]!);
    return parsed.data;
}
export const segmento = encodeURIComponent;
export const consulta = (key: string, value: string) =>
    new URLSearchParams({ [key]: value }).toString();
