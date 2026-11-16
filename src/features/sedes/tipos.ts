import { z } from 'zod';
import { Codigo } from '../../lib/validacion';
export const SedeSchema = z.object({
    id: z.number().int().positive(),
    code: Codigo,
    name: z.string(),
    city: z.string(),
    address: z.string().nullable(),
    capacity: z.number().int().nonnegative(),
    active: z.boolean(),
});
export type Sede = z.infer<typeof SedeSchema>;
