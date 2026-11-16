import { z } from 'zod';
const schema = z.object({
    token: z.string().min(1),
    expiraEn: z.number().finite().positive(),
});
export type Credencial = z.infer<typeof schema>;
const key = 'pulsepass.sesion';
function restaurar(): Credencial | null {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const p = schema.safeParse(JSON.parse(raw));
        if (p.success && p.data.expiraEn > Date.now()) return p.data;
    } catch {
        /* Un dato corrupto no debe romper la aplicación. */
    }
    try {
        sessionStorage.removeItem(key);
    } catch {
        /* Memoria si no hay storage. */
    }
    return null;
}
let valor = restaurar();
const listeners = new Set<() => void>();
export const credencial = () => valor;
export const suscribir = (f: () => void) => {
    listeners.add(f);
    return () => {
        listeners.delete(f);
    };
};
export function guardarSesion(next: Credencial | null) {
    valor = next;
    try {
        if (next) sessionStorage.setItem(key, JSON.stringify(schema.parse(next)));
        else sessionStorage.removeItem(key);
    } catch {
        /* La sesión aún funciona en memoria. */
    }
    listeners.forEach((f) => f());
}
