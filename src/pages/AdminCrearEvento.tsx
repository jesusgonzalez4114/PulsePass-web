import { useNavigate } from 'react-router';
import { useSedes } from '../features/sedes/hooks';
import { useCrearEvento } from '../features/eventos/hooks';
import { CrearEventoSchema } from '../features/eventos/tipos';
import { recordar } from '../features/eventos/recientes';
import { Categoria } from '../lib/validacion';
import { RUTAS } from '../lib/rutas';
import { Datos } from '../components/ui';
import { Formulario } from '../components/Formulario';
export default function AdminCrearEvento() {
    const q = useSedes();
    const m = useCrearEvento();
    const navigate = useNavigate();
    return (
        <div className="estrecho panel">
            <h1>Nuevo evento</h1>
            <Datos consulta={q}>
                {(sedes) => (
                    <Formulario
                        schema={CrearEventoSchema}
                        inicial={{ description: '', minimumAge: 0 }}
                        campos={[
                            { nombre: 'eventCode', etiqueta: 'Código del evento' },
                            { nombre: 'name', etiqueta: 'Nombre' },
                            {
                                nombre: 'description',
                                etiqueta: 'Descripción',
                                tipo: 'textarea',
                            },
                            {
                                nombre: 'category',
                                etiqueta: 'Categoría',
                                tipo: 'select',
                                opciones: Categoria.options.map((value) => ({
                                    value,
                                    label: value,
                                })),
                            },
                            {
                                nombre: 'eventDate',
                                etiqueta: 'Fecha y hora local del evento',
                                tipo: 'datetime-local',
                            },
                            { nombre: 'minimumAge', etiqueta: 'Edad mínima', tipo: 'number' },
                            {
                                nombre: 'venueCode',
                                etiqueta: 'Sede',
                                tipo: 'select',
                                opciones: sedes.map((s) => ({
                                    value: s.code,
                                    label: `${s.name} · ${s.city}`,
                                })),
                            },
                        ]}
                        texto="Crear evento"
                        enviar={async (v) => {
                            const e = await m.mutateAsync(v);
                            recordar(e.eventCode);
                            navigate(RUTAS.gestion(e.eventCode));
                        }}
                    />
                )}
            </Datos>
        </div>
    );
}
