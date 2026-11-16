import { z } from 'zod';
export const UsuarioSchema = z.object({
    id: z.number().int().positive(),
    username: z.string(),
    email: z.email(),
    active: z.boolean(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    city: z.string().nullable(),
});

