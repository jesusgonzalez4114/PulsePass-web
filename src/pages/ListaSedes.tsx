import { Link } from 'react-router';
import { useSedes } from '../features/sedes/hooks';
import { RUTAS } from '../lib/rutas';
import { Datos, Badge } from '../components/ui';
export default function ListaSedes() {
    const q = useSedes();
    return (
        <>
            <h1>Sedes</h1>
            <Datos consulta={q}>
                {(items) => (
                    <div className="rejilla">
                        {items.map((s) => (
                            <article key={s.code} className="panel">
                                <h2>
                                    <Link className="enlace" to={RUTAS.sede(s.code)}>
                                        {s.name}
                                    </Link>
                                </h2>
                                <p>
                                    {s.city} · Capacidad: {s.capacity}
                                </p>
                                <Badge texto={s.active ? 'Activa' : 'Inactiva'} />
                            </article>
                        ))}
                    </div>
                )}
            </Datos>
        </>
    );
}
