import { Link, useNavigate } from 'react-router';
import { recientes } from '../features/eventos/recientes';
import { BuscarCodigo } from '../components/BuscarCodigo';
import { RUTAS } from '../lib/rutas';
export default function AdminEventos() {
    const navigate = useNavigate();
    const codes = recientes();
    return (
        <div className="estrecho">
            <h1>Administración de eventos</h1>
            <Link className="enlace mb-4" to={RUTAS.nuevo}>
                Crear nuevo evento
            </Link>
            <section className="panel">
                <BuscarCodigo
                    etiqueta="Buscar evento por código"
                    buscar={(c) => navigate(RUTAS.gestion(c))}
                />
            </section>
            <h2 className="mt-8">Creados en esta pestaña</h2>
            {codes.length ? (
                <ul className="panel">
                    {codes.map((c) => (
                        <li key={c}>
                            <Link className="enlace font-mono" to={RUTAS.gestion(c)}>
                                {c}
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No has creado eventos en esta pestaña.</p>
            )}
            <p className="mt-5 text-sm">
                La API no ofrece un listado de todos los borradores. Conserva el código
                de cada evento.
            </p>
        </div>
    );
}
