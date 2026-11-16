import { Link, useNavigate } from 'react-router';
import { useRegistro } from '../features/auth/AuthContext';
import { RegistroSchema } from '../features/auth/tipos';
import { Formulario } from '../components/Formulario';
import { ApiError } from '../lib/http';
import { RUTAS } from '../lib/rutas';
export default function Registro() {
    const m = useRegistro();
    const navigate = useNavigate();
    return (
        <section className="panel mx-auto max-w-lg">
            <h1>Crea tu cuenta</h1>
            <Formulario
                schema={RegistroSchema}
                inicial={{ phone: '', city: '' }}
                campos={[
                    {
                        nombre: 'username',
                        etiqueta: 'Nombre de usuario',
                        autoComplete: 'username',
                    },
                    {
                        nombre: 'email',
                        etiqueta: 'Correo electrónico',
                        tipo: 'email',
                        autoComplete: 'email',
                    },
                    {
                        nombre: 'firstName',
                        etiqueta: 'Nombres',
                        autoComplete: 'given-name',
                    },
                    {
                        nombre: 'lastName',
                        etiqueta: 'Apellidos',
                        autoComplete: 'family-name',
                    },
                    {
                        nombre: 'birthDate',
                        etiqueta: 'Fecha de nacimiento',
                        tipo: 'date',
                        autoComplete: 'bday',
                    },
                    {
                        nombre: 'phone',
                        etiqueta: 'Teléfono (opcional)',
                        autoComplete: 'tel',
                    },
                    {
                        nombre: 'city',
                        etiqueta: 'Ciudad (opcional)',
                        autoComplete: 'address-level2',
                    },
                    {
                        nombre: 'password',
                        etiqueta: 'Contraseña (mínimo 12 caracteres)',
                        tipo: 'password',
                        autoComplete: 'new-password',
                    },
                ]}
                texto="Crear cuenta"
                enviar={async (v) => {
                    try {
                        await m.mutateAsync(v);
                    } catch (e) {
                        if (e instanceof ApiError && e.status === 409)
                            throw new ApiError(
                                409,
                                'No se pudo registrar la cuenta. Revisa los datos o inicia sesión.',
                            );
                        throw e;
                    }
                    navigate(RUTAS.login, { replace: true, state: { registro: true } });
                }}
            />
            <Link className="enlace mt-4" to={RUTAS.login}>
                ¿Ya tienes cuenta? Inicia sesión
            </Link>
        </section>
    );
}
