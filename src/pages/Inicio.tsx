import { Link } from 'react-router';
import { useCatalogo } from '../features/eventos/hooks';
import { useArtistas } from '../features/artistas/hooks';
import { RUTAS } from '../lib/rutas';
import { Datos } from '../components/ui';
import { ListaEventos } from '../components/Eventos';
export default function Inicio() {
    const q = useCatalogo();
    const artistas = useArtistas();
    return (
        <>
            <section className="from-marca-600 to-acento-500 mb-10 rounded-2xl bg-linear-to-r p-7 text-white md:p-12">
                <h1>Descubre los mejores eventos</h1>
                <p className="mb-6">
                    Música, cultura, deporte y tecnología en un solo lugar.
                </p>
                <div className="flex flex-wrap gap-4">
                    <Link
                        className="text-marca-700 rounded-lg bg-white px-5 py-3 font-semibold"
                        to={RUTAS.eventos}
                    >
                        Ver cartelera
                    </Link>
                    <Link
                        className="rounded-lg border border-white px-5 py-3"
                        to={RUTAS.registro}
                    >
                        Crear cuenta
                    </Link>
                </div>
            </section>
            <h2>Próximos eventos</h2>
            <Datos consulta={q}>
                {(eventos) => (
                    <ListaEventos
                        eventos={[...eventos]
                            .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
                            .slice(0, 3)}
                    />
                )}
            </Datos>
            <h2 className="mt-10">Artistas destacados</h2>
            <Datos consulta={artistas}>
                {(items) => (
                    <div className="flex flex-wrap gap-5">
                        {items.slice(0, 6).map((a) => (
                            <Link
                                className="panel enlace"
                                key={a.id}
                                to={RUTAS.artista(a.id)}
                            >
                                {a.stageName}
                            </Link>
                        ))}
                    </div>
                )}
            </Datos>
        </>
    );
}
