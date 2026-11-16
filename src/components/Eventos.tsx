import { Link } from 'react-router';
import type { Evento } from '../features/eventos/tipos';
import { Badge } from './ui';
import { RUTAS } from '../lib/rutas';
import { fecha } from '../lib/formato';
const visual: Record<
    Evento['category'],
    { clase: string; trazo: string; nombre: string }
> = {
    MUSIC: {
        clase:
            'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200',
        trazo: 'M9 18V5l12-2v13M9 8l12-2M9 18a3 3 0 1 1-3-3M21 16a3 3 0 1 1-3-3',
        nombre: 'Música',
    },
    SPORTS: {
        clase:
            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
        trazo: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3v18',
        nombre: 'Deportes',
    },
    TECHNOLOGY: {
        clase: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
        trazo: 'M3 4h18v13H3zM8 21h8M12 17v4',
        nombre: 'Tecnología',
    },
    EDUCATION: {
        clase: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
        trazo: 'm2 8 10-5 10 5-10 5zM6 10v7l6 4 6-4v-7',
        nombre: 'Educación',
    },
    CULTURE: {
        clase: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
        trazo: 'm3 8 9-5 9 5zM5 10v10M12 10v10M19 10v10M3 21h18',
        nombre: 'Cultura',
    },
    ENTERTAINMENT: {
        clase:
            'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
        trazo: 'm12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
        nombre: 'Entretenimiento',
    },
};
export function PanelCategoria({
                                   categoria,
                               }: {
    categoria: Evento['category'];
}) {
    const v = visual[categoria];
    return (
        <div
            className={`flex h-32 items-center justify-center rounded-t-xl ${v.clase}`}
        >
            <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="40"
                height="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
            >
                <path d={v.trazo} />
            </svg>
        </div>
    );
}
export function TarjetaEvento({ evento: e }: { evento: Evento }) {
    return (
        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <PanelCategoria categoria={e.category} />
            <div className="p-5">
                <p className="text-marca-700 text-xs font-semibold dark:text-indigo-300">
                    {visual[e.category].nombre}
                </p>
                <h2 className="my-2 text-lg">
                    <Link className="hover:underline" to={RUTAS.evento(e.eventCode)}>
                        {e.name}
                    </Link>
                </h2>
                <p className="mb-2 text-sm">{fecha(e.eventDate)}</p>
                <p className="mb-3 text-sm">{e.venueName}</p>
                <Badge texto={e.status} />
            </div>
        </article>
    );
}
export function ListaEventos({ eventos }: { eventos: Evento[] }) {
    return eventos.length ? (
        <div className="rejilla">
            {eventos.map((e) => (
                <TarjetaEvento key={e.eventCode} evento={e} />
            ))}
        </div>
    ) : (
        <p role="status" className="panel">
            No hay resultados.
        </p>
    );
}
