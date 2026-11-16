import { z } from 'zod';
export const Codigo = z
    .string()
    .trim()
    .min(1, 'Campo obligatorio')
    .max(255)
    .refine(
        (v) => ![...v].some((c) => '/\\?#'.includes(c) || c.charCodeAt(0) < 32),
        'Código inválido',
    );
export const Id = z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().positive().safe());
export const FechaHora = z.iso.datetime({ local: true, precision: null });
export const Texto = z.string().trim().min(1, 'Campo obligatorio');
export const Categoria = z.enum([
    'MUSIC',
    'SPORTS',
    'TECHNOLOGY',
    'EDUCATION',
    'CULTURE',
    'ENTERTAINMENT',
]);
export const EstadoEvento = z.enum([
    'DRAFT',
    'PUBLISHED',
    'SOLD_OUT',
    'CANCELLED',
    'FINISHED',
]);
export const EstadoTicket = z.enum(['RESERVED', 'PAID', 'CANCELLED', 'USED']);
export const TipoTicket = z.enum(['GENERAL', 'VIP', 'BACKSTAGE', 'STUDENT']);
export const Rol = z.enum(['USER', 'STAFF', 'ADMIN']);
export type Rol = z.infer<typeof Rol>;
export const BuscarSchema = z.object({ codigo: Codigo });
export const regresoSeguro = (state: unknown) => {
    const parsed = z
        .object({
            desde: z
                .string()
                .startsWith('/')
                .refine(
                    (v) =>
                        !v.startsWith('//') &&
                        !v.includes('\\') &&
                        ![...v].some((c) => c.charCodeAt(0) < 32),
                ),
        })
        .safeParse(state);
    return parsed.success ? parsed.data.desde : '/';
};
export function parametro(schema: typeof Codigo, value: unknown) {
    return schema.safeParse(value);
}
