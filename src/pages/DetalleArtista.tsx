import { useParams } from 'react-router';
import { useArtista } from '../features/artistas/hooks';
import { useCatalogo } from '../features/eventos/hooks';
import { Datos } from '../components/ui';
import { ListaEventos } from '../components/Eventos';
import { Id } from '../lib/validacion';
import NoEncontrada from './NoEncontrada';
function EventosArtista({ nombre }: { nombre: string }) {
    const q = useCatalogo(nombre);
    return <Datos consulta={q}>{(e) => <ListaEventos eventos={e} />}</Datos>;
}
export default function DetalleArtista() {
    const id = Id.safeParse(useParams().id);
    const q = useArtista(id.success ? id.data : 0);
    if (!id.success) return <NoEncontrada />;
    return (
        <Datos consulta={q} noDisponible="Artista no disponible">
            {(a) => (
                <>
                    <section className="panel mb-6">
                        <h1>{a.stageName}</h1>
                        <p>
                            {a.country} · {a.genre}
                        </p>
                    </section>
                    <h2>Eventos de {a.stageName}</h2>
                    <EventosArtista nombre={a.stageName} />
                </>
            )}
        </Datos>
    );
}
