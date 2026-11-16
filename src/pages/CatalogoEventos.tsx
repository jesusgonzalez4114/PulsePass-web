import { useSearchParams } from 'react-router';
import { z } from 'zod';
import { useCatalogo } from '../features/eventos/hooks';
import { useArtistas } from '../features/artistas/hooks';
import { Categoria } from '../lib/validacion';
import { Datos, Boton, Aviso } from '../components/ui';
import { ListaEventos } from '../components/Eventos';
const Filtros = z.object({
    q: z.string().max(150).catch(''),
    categoria: z.union([z.literal(''), Categoria]).catch(''),
    artista: z.string().max(150).catch(''),
});
export default function CatalogoEventos() {
    const [params, setParams] = useSearchParams();
    const filtros = Filtros.parse({
        q: params.get('q') || '',
        categoria: params.get('categoria') || '',
        artista: params.get('artista') || '',
    });
    const q = useCatalogo(filtros.artista);
    const artistas = useArtistas();
    const cambiar = (key: string, value: string) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value);
        else next.delete(key);
        setParams(next, { replace: true });
    };
    return (
        <>
            <h1>Cartelera</h1>
            <div className="panel mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <label htmlFor="texto">Buscar por nombre</label>
                    <input
                        id="texto"
                        value={filtros.q}
                        maxLength={150}
                        onChange={(e) => cambiar('q', e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="categoria">Categoría</label>
                    <select
                        id="categoria"
                        value={filtros.categoria}
                        onChange={(e) => cambiar('categoria', e.target.value)}
                    >
                        <option value="">Todas</option>
                        {Categoria.options.map((v) => (
                            <option key={v}>{v}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="artista">Artista</label>
                    <select
                        id="artista"
                        value={filtros.artista}
                        onChange={(e) => cambiar('artista', e.target.value)}
                    >
                        <option value="">Todos</option>
                        {artistas.data?.map((a) => (
                            <option key={a.id} value={a.stageName}>
                                {a.stageName}
                            </option>
                        ))}
                    </select>
                </div>
                <Boton variante="secundario" onClick={() => setParams({})}>
                    Limpiar filtros
                </Boton>
            </div>
            {artistas.isError && (
                <Aviso error>No pudimos cargar el selector de artistas.</Aviso>
            )}
            <Datos consulta={q}>
                {(items) => (
                    <ListaEventos
                        eventos={items.filter(
                            (e) =>
                                e.name
                                    .toLocaleLowerCase()
                                    .includes(filtros.q.toLocaleLowerCase()) &&
                                (!filtros.categoria || e.category === filtros.categoria),
                        )}
                    />
                )}
            </Datos>
        </>
    );
}
