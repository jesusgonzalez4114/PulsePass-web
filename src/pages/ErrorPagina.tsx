import { Link } from 'react-router';
import { RUTAS } from '../lib/rutas';
export default function ErrorPagina() {
    return (
        <section className="panel mx-auto max-w-lg text-center">
            <h1>Algo salió mal</h1>
            <p>No pudimos mostrar esta página. Inténtalo más tarde.</p>
            <Link className="enlace mt-4" to={RUTAS.inicio}>
                Volver al inicio
            </Link>
        </section>
    );
}
