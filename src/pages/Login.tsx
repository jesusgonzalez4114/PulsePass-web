import { Link, useLocation, useNavigate } from 'react-router';
import { z } from 'zod';
import { useLogin } from '../features/auth/AuthContext';
import { LoginSchema } from '../features/auth/tipos';
import { Formulario } from '../components/Formulario';
import { Aviso } from '../components/ui';
import { regresoSeguro } from '../lib/validacion';
import { RUTAS } from '../lib/rutas';
export default function Login() {
    const m = useLogin();
    const location = useLocation();
    const navigate = useNavigate();
    const p = z.object({ registro: z.literal(true) }).safeParse(location.state);
    return (
        <section className="panel mx-auto max-w-md">
            <h1>Inicia sesión</h1>
            {p.success && <Aviso>Cuenta creada. Inicia sesión.</Aviso>}
            <Formulario
                schema={LoginSchema}
                campos={[
                    {
                        nombre: 'identifier',
                        etiqueta: 'Usuario o correo',
                        autoComplete: 'username',
                    },
                    {
                        nombre: 'password',
                        etiqueta: 'Contraseña',
                        tipo: 'password',
                        autoComplete: 'current-password',
                    },
                ]}
                texto="Ingresar"
                enviar={async (v) => {
                    await m.mutateAsync(v);
                    navigate(regresoSeguro(location.state), { replace: true });
                }}
            />
            <Link className="enlace mt-4" to={RUTAS.registro}>
                ¿No tienes cuenta? Regístrate
            </Link>
        </section>
    );
}
