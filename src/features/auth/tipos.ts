import { z } from 'zod';
import { Rol, Texto } from '../../lib/validacion';
export const PrincipalSchema = z.object({
    id: z.number().int().positive(),
    username: z.string(),
    email: z.email(),
    roles: z.array(Rol).min(1),
});
export const TokenSchema = z.object({
    accessToken: z.string().min(1),
    tokenType: z.literal('Bearer'),
    expiresIn: z.number().int().positive().max(86400),
});
export const LoginSchema = z.object({
    identifier: Texto.max(150),
    password: z.string().min(1, 'Ingresa tu contraseña').max(72),
});
export const RegistroSchema = z.object({
    username: Texto.max(50),
    email: z.email('Correo inválido').max(150),
    firstName: Texto,
    lastName: Texto,
    phone: z.string(),
    city: z.string(),
    birthDate: z.iso
        .date()
        .refine(
            (v) => v <= new Date().toLocaleDateString('en-CA'),
            'La fecha no puede ser futura',
        ),
    password: z
        .string()
        .min(12, 'Mínimo 12 caracteres')
        .max(72)
        .refine(
            (v) => new TextEncoder().encode(v).length <= 72,
            'Máximo 72 bytes UTF-8',
        ),
});
export type Principal = z.infer<typeof PrincipalSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type Registro = z.infer<typeof RegistroSchema>;
