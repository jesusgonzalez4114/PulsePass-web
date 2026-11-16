import { Link } from 'react-router';
import { RUTAS } from '../lib/rutas';
export default function SinPermisos() {
    return (
        <section className="panel mx-auto max-w-lg text-center">
            <h1>403</h1>
            <p>No tienes permisos para acceder a esta página.</p>
            <Link className="enlace mt-4" to={RUTAS.inicio}>
                Volver al inicio
            </Link>
        </section>
    );
}
