import { useState } from 'react';
import { useParams } from 'react-router';
import { z } from 'zod';
import { useEvento, usePublicar, useAsociar } from '../features/eventos/hooks';
import { useArtistas } from '../features/artistas/hooks';
import { Codigo } from '../lib/validacion';
import { mensaje } from '../lib/http';
import { Datos, Badge, Boton, Modal, Aviso } from '../components/ui';
import { Formulario } from '../components/Formulario';
import NoEncontrada from './NoEncontrada';
const Seleccion = z.object({
    artistId: z.string().regex(/^[1-9]\d*$/, 'Selecciona un artista'),
});
function Asociar({ code }: { code: string }) {
    const q = useArtistas();
    const m = useAsociar();
    return (
        <Datos consulta={q}>
            {(items) => (
                <>
                    <Formulario
                        schema={Seleccion}
                        campos={[
                            {
                                nombre: 'artistId',
                                etiqueta: 'Artista activo',
                                tipo: 'select',
                                opciones: items.map((a) => ({
                                    value: String(a.id),
                                    label: a.stageName,
                                })),
                            },
                        ]}
                        texto="Asociar artista"
                        enviar={async (v) => {
                            await m.mutateAsync({ code, id: Number(v.artistId) });
                        }}
                    />
                    {m.isSuccess && <Aviso>Artista asociado.</Aviso>}
                </>
            )}
        </Datos>
    );
}
export default function AdminGestionEvento() {
    const p = Codigo.safeParse(useParams().eventCode);
    const q = useEvento(p.success ? p.data : '');
    const m = usePublicar();
    const [abierto, setAbierto] = useState(false);
    if (!p.success) return <NoEncontrada />;
    return (
        <div className="estrecho">
            <h1>Gestionar evento</h1>
            <Datos consulta={q}>
                {(e) => (
                    <>
                        <section className="panel mb-6">
                            <h2>{e.name}</h2>
                            <p className="mb-3 font-mono">{e.eventCode}</p>
                            <Badge texto={e.status} />
                            <div className="mt-5">
                                <Boton
                                    disabled={e.status !== 'DRAFT'}
                                    onClick={() => {
                                        m.reset();
                                        setAbierto(true);
                                    }}
                                >
                                    Publicar evento
                                </Boton>
                            </div>
                            {m.isSuccess && <Aviso>Evento publicado.</Aviso>}
                        </section>
                        <section className="panel">
                            <h2>Artistas asociados</h2>
                            {e.artists.length ? (
                                <ul className="mb-5 list-inside list-disc">
                                    {e.artists.map((a) => (
                                        <li key={a}>{a}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mb-5">Sin artistas asociados.</p>
                            )}
                            <Asociar code={e.eventCode} />
                        </section>
                        {abierto && (
                            <Modal
                                titulo="Publicar evento"
                                cerrar={() => setAbierto(false)}
                                ocupado={m.isPending}
                            >
                                <p>¿Publicar {e.name} en la cartelera?</p>
                                {m.isError && <Aviso error>{mensaje(m.error)}</Aviso>}
                                <Boton
                                    cargando={m.isPending}
                                    onClick={() =>
                                        m.mutate(e.eventCode, {
                                            onSuccess: () => setAbierto(false),
                                        })
                                    }
                                >
                                    Confirmar publicación
                                </Boton>
                            </Modal>
                        )}
                    </>
                )}
            </Datos>
        </div>
    );
}
