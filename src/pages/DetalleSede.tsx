import { useParams } from 'react-router';
import { useSede } from '../features/sedes/hooks';
import { Codigo } from '../lib/validacion';
import { Datos, Badge } from '../components/ui';
import NoEncontrada from './NoEncontrada';
export default function DetalleSede() {
    const p = Codigo.safeParse(useParams().code);
    const q = useSede(p.success ? p.data : '');
    if (!p.success) return <NoEncontrada />;
    return (
        <Datos consulta={q} noDisponible="Sede no disponible">
            {(s) => (
                <article className="panel">
                    <h1>{s.name}</h1>
                    <p className="font-mono">{s.code}</p>
                    <p>
                        {s.city} · {s.address || 'Dirección no informada'}
                    </p>
                    <p>Capacidad: {s.capacity} personas</p>
                    <Badge texto={s.active ? 'Activa' : 'Inactiva'} />
                </article>
            )}
        </Datos>
    );
}
