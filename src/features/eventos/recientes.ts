import { z } from 'zod';
import { Codigo } from '../../lib/validacion';
const schema = z.array(Codigo).max(20);
const key = 'pulsepass.eventos-recientes';
export function recientes() {
    try {
        const raw = sessionStorage.getItem(key);
        const p = schema.safeParse(raw ? JSON.parse(raw) : []);
        return p.success ? p.data : [];
    } catch {
        return [];
    }
}
export function recordar(code: string) {
    try {
        sessionStorage.setItem(
            key,
            JSON.stringify(
                [Codigo.parse(code), ...recientes().filter((c) => c !== code)].slice(
                    0,
                    20,
                ),
            ),
        );
    } catch {
        /* No afecta la creación. */
    }
}
