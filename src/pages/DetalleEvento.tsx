import { Link, useParams } from 'react-router';
import { useEvento } from '../features/eventos/hooks';
import { useSede } from '../features/sedes/hooks';
import { useArtistaNombre } from '../features/artistas/hooks';
import { Codigo } from '../lib/validacion';
import { RUTAS } from '../lib/rutas';
import { fecha } from '../lib/formato';
import { Datos, Badge } from '../components/ui';
import { PanelCategoria } from '../components/Eventos';
import NoEncontrada from './NoEncontrada';
function ArtistaEnlace({ nombre }: { nombre: string }) {
    const q = useArtistaNombre(nombre);
    return q.data ? (
        <Link className="enlace mr-4" to={RUTAS.artista(q.data.id)}>
            {nombre}
        </Link>
    ) : (
        <span className="mr-4">{nombre}</span>
    );
}
function SedeEvento({ code }: { code: string }) {
    const q = useSede(code);
    return (
        <Datos consulta={q}>
            {(s) => (
                <div className="panel">
                    <Link className="enlace" to={RUTAS.sede(s.code)}>
                        {s.name}
                    </Link>
                    <p>
                        {s.city} · Capacidad: {s.capacity}
                    </p>
                </div>
            )}
        </Datos>
    );
}
export default function DetalleEvento() {
    const p = Codigo.safeParse(useParams().eventCode);
    const q = useEvento(p.success ? p.data : '');
    if (!p.success) return <NoEncontrada />;
    return (
        <div className="pb-40 md:pb-0">
            <Link className="enlace mb-4" to={RUTAS.eventos}>
                Volver a cartelera
            </Link>
            <Datos consulta={q} noDisponible="Evento no disponible">
                {(e) => (
                    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                        <article className="panel">
                            <PanelCategoria categoria={e.category} />
                            <div className="py-4">
                                <Badge texto={e.status} />
                                <h1 className="mt-4">{e.name}</h1>
                                <p>
                                    {fecha(e.eventDate)} · Edad mínima: {e.minimumAge}
                                </p>
                                <p className="my-6 whitespace-pre-wrap">
                                    {e.description || 'Sin descripción.'}
                                </p>
                                <h2>Artistas</h2>
                                {e.artists.length ? (
                                    e.artists.map((name) => (
                                        <ArtistaEnlace key={name} nombre={name} />
                                    ))
                                ) : (
                                    <p>Sin artistas asociados.</p>
                                )}
                                <h2 className="mt-6">Sede</h2>
                                <SedeEvento code={e.venueCode} />
                            </div>
                        </article>
                        <aside>
                        </aside>
                    </div>
                )}
            </Datos>
        </div>
    );
}
