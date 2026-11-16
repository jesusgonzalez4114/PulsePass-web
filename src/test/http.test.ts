import { z } from 'zod';
import { http as mock, HttpResponse } from 'msw';
import { http, ApiError } from '../lib/http';
import { guardarSesion } from '../lib/sesionStore';
import { server, base, fallo, peticiones } from './fixtures';
import { precioCOP } from '../lib/formato';
import { RegistroSchema } from '../features/auth/tipos';
import { regresoSeguro } from '../lib/validacion';
test('LIB-001 Bearer solo en header', async () => {
    guardarSesion({ token: 'fake-token', expiraEn: Date.now() + 900000 });
    await http('/auth/me', z.unknown());
    expect(peticiones[0]?.auth).toBe('Bearer fake-token');
    expect(peticiones[0]?.path).not.toContain('fake-token');
});
test('LIB-002 400 conserva details', async () => {
    server.use(
        mock.get(`${base}/probe`, () =>
            fallo(400, 'Error', { name: 'Falta nombre' }),
        ),
    );
    await expect(http('/probe', z.unknown())).rejects.toMatchObject({
        status: 400,
        details: { name: 'Falta nombre' },
    });
});
test('LIB-003 cuerpo inválido usa mensaje seguro', async () => {
    server.use(
        mock.get(
            `${base}/probe`,
            () => new HttpResponse('<h1>stack secreto</h1>', { status: 500 }),
        ),
    );
    await expect(http('/probe', z.unknown())).rejects.toMatchObject({
        status: 500,
        message: 'Ocurrió un error inesperado. Inténtalo más tarde.',
    });
});
test('LIB-004 401 dispara cierre', async () => {
    guardarSesion({ token: 'fake-token', expiraEn: Date.now() + 900000 });
    const listener = vi.fn();
    window.addEventListener('pulsepass:401', listener);
    server.use(mock.get(`${base}/probe`, () => fallo(401)));
    await expect(http('/probe', z.unknown())).rejects.toBeInstanceOf(ApiError);
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener('pulsepass:401', listener);
});
test('LIB-005 formato COP', () => {
    expect(precioCOP(250000)).toBe(
        new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
        }).format(250000),
    );
});
test.each([400, 401, 403, 404, 409, 500])(
    'HTTP %s conserva status',
    async (status) => {
        server.use(mock.get(`${base}/probe`, () => fallo(status)));
        await expect(http('/probe', z.unknown())).rejects.toMatchObject({ status });
    },
);
test('respuesta exitosa incompatible se rechaza', async () => {
    server.use(
        mock.get(`${base}/probe`, () => HttpResponse.json({ unexpected: true })),
    );
    await expect(
        http('/probe', z.object({ name: z.string() })),
    ).rejects.toMatchObject({ status: 502 });
});
test('error de red se convierte en status 0', async () => {
    server.use(mock.get(`${base}/probe`, () => HttpResponse.error()));
    await expect(http('/probe', z.unknown())).rejects.toMatchObject({
        status: 0,
    });
});
test('bloquea regreso a dominio externo', () => {
    expect(regresoSeguro({ desde: '//evil.example' })).toBe('/');
    expect(regresoSeguro({ desde: '/eventos/EV-01' })).toBe('/eventos/EV-01');
});
test('registro limita UTF-8 y fechas reales', () => {
    const v = {
        username: 'ana',
        email: 'a@example.test',
        firstName: 'Ana',
        lastName: 'Ruiz',
        phone: '',
        city: '',
        birthDate: '2000-01-01',
        password: 'a'.repeat(12),
    };
    expect(RegistroSchema.safeParse(v).success).toBe(true);
    expect(
        RegistroSchema.safeParse({ ...v, password: '😀'.repeat(19) }).success,
    ).toBe(false);
    expect(
        RegistroSchema.safeParse({ ...v, birthDate: '2020-02-30' }).success,
    ).toBe(false);
});
