import { useState } from 'react';
import { Link } from 'react-router';
import { useArtistas, useArtistaNombre } from '../features/artistas/hooks';
import { RUTAS } from '../lib/rutas';
import { Datos } from '../components/ui';
import { BuscarCodigo } from '../components/BuscarCodigo';
function Resultado({ nombre }: { nombre: string }) {
    const q = useArtistaNombre(nombre);
    return (
        <Datos consulta={q}>
            {(a) => (
                <Link className="enlace" to={RUTAS.artista(a.id)}>
                    {a.stageName}
                </Link>
            )}
        </Datos>
    );
}
export default function ListaArtistas() {
    const q = useArtistas();
    const [nombre, setNombre] = useState('');
    return (
        <>
            <h1>Artistas</h1>
            <details className="panel mb-6">
                <summary className="py-2">Buscar por nombre artístico exacto</summary>
                <BuscarCodigo etiqueta="Nombre artístico" buscar={setNombre} />
                {nombre && <Resultado nombre={nombre} />}
            </details>
            <Datos consulta={q}>
                {(items) => (
                    <div className="rejilla">
                        {items.map((a) => (
                            <article key={a.id} className="panel">
                                <div
                                    aria-hidden="true"
                                    className="mb-4 flex size-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-800"
                                >
                                    {a.stageName.slice(0, 2).toUpperCase()}
                                </div>
                                <h2>
                                    <Link className="enlace" to={RUTAS.artista(a.id)}>
                                        {a.stageName}
                                    </Link>
                                </h2>
                                <p>
                                    {a.country} · {a.genre}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </Datos>
        </>
    );
}
