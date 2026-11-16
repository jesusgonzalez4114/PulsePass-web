import {
    useEffect,
    useId,
    useRef,
    type ReactNode,
    type ButtonHTMLAttributes,
} from 'react';
import { clsx } from 'clsx';
import { Navigate } from 'react-router';
import { RUTAS } from '../lib/rutas';
import { ApiError, mensaje } from '../lib/http';
interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variante?: 'primario' | 'secundario' | 'peligro' | 'fantasma';
    cargando?: boolean;
}
const variantes = {
    primario: 'bg-marca-600 text-white hover:bg-marca-700',
    secundario:
        'border border-slate-400 bg-white text-slate-900 dark:bg-slate-800 dark:text-white',
    peligro: 'bg-red-700 text-white hover:bg-red-800',
    fantasma: 'text-marca-700 dark:text-indigo-300',
};
export function Boton({
                          variante = 'primario',
                          cargando = false,
                          disabled,
                          className,
                          children,
                          ...props
                      }: BotonProps) {
    return (
        <button
            type="button"
            {...props}
            disabled={disabled || cargando}
            aria-busy={cargando}
            className={clsx(
                'min-h-11 rounded-lg px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-60',
                variantes[variante],
                className,
            )}
        >
            {cargando ? 'Cargando…' : children}
        </button>
    );
}
export function Aviso({
                          children,
                          error = false,
                      }: {
    children: ReactNode;
    error?: boolean;
}) {
    return (
        <div
            role={error ? 'alert' : 'status'}
            className={clsx(
                'my-3 rounded-lg border p-3',
                error
                    ? 'border-red-300 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100'
                    : 'border-indigo-300 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100',
            )}
        >
            {children}
        </div>
    );
}
export function Badge({ texto }: { texto: string }) {
    const ok = ['PUBLISHED', 'PAID', 'Activa', 'USED'].includes(texto);
    return (
        <span
            className={clsx(
                'inline-block rounded px-2 py-1 text-xs font-semibold',
                ok
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
            )}
        >
      {texto}
    </span>
    );
}
interface EstadoConsulta<T> {
    status: 'pending' | 'error' | 'success';
    data?: T;
    error: unknown;
    refetch: () => unknown;
}
interface DatosProps<T> {
    consulta: EstadoConsulta<T>;
    children: (data: T) => ReactNode;
    vacio?: (data: T) => boolean;
    noDisponible?: string;
}
export function Datos<T>({
                             consulta: q,
                             children,
                             vacio,
                             noDisponible,
                         }: DatosProps<T>) {
    if (q.status === 'pending')
        return (
            <p role="status" aria-live="polite">
                Cargando…
            </p>
        );
    if (
        q.status === 'error' &&
        q.error instanceof ApiError &&
        q.error.status === 403 &&
        !noDisponible
    )
        return <Navigate to={RUTAS.sinPermisos} replace />;
    if (q.status === 'error')
        return (
            <>
                <Aviso error>
                    {noDisponible &&
                    q.error instanceof ApiError &&
                    [403, 404].includes(q.error.status)
                        ? noDisponible
                        : mensaje(q.error)}
                </Aviso>
                <Boton
                    variante="secundario"
                    onClick={() => {
                        void q.refetch();
                    }}
                >
                    Reintentar
                </Boton>
            </>
        );
    if (
        q.data === undefined ||
        (vacio?.(q.data) ?? (Array.isArray(q.data) && q.data.length === 0))
    )
        return (
            <p role="status" className="panel">
                No hay resultados.
            </p>
        );
    return <>{children(q.data)}</>;
}
interface ModalProps {
    titulo: string;
    children: ReactNode;
    cerrar: () => void;
    ocupado?: boolean;
}
export function Modal({
                          titulo,
                          children,
                          cerrar,
                          ocupado = false,
                      }: ModalProps) {
    const ref = useRef<HTMLDialogElement>(null);
    const id = useId();
    useEffect(() => {
        const d = ref.current;
        const previo = document.activeElement;
        d?.showModal();
        return () => {
            d?.close();
            if (previo instanceof HTMLElement) previo.focus();
        };
    }, []);
    return (
        <dialog
            ref={ref}
            aria-labelledby={id}
            onCancel={(e) => {
                e.preventDefault();
                if (!ocupado) cerrar();
            }}
            className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-xl border border-slate-200 bg-white p-6 text-slate-900 dark:bg-slate-900 dark:text-white"
        >
            <div className="mb-4 flex items-center justify-between gap-4">
                <h2 id={id} className="mb-0">
                    {titulo}
                </h2>
                <Boton
                    variante="fantasma"
                    aria-label="Cerrar diálogo"
                    disabled={ocupado}
                    onClick={cerrar}
                >
                    ×
                </Boton>
            </div>
            {children}
        </dialog>
    );
}
interface Columna<T> {
    titulo: string;
    render: (item: T) => ReactNode;
}
export function Tabla<T>({
                             filas,
                             columnas,
                             clave,
                         }: {
    filas: T[];
    columnas: Columna<T>[];
    clave: (item: T) => string;
}) {
    return (
        <>
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                    <thead>
                    <tr>
                        {columnas.map((c) => (
                            <th key={c.titulo} scope="col" className="border-b p-3">
                                {c.titulo}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {filas.map((f) => (
                        <tr key={clave(f)}>
                            {columnas.map((c) => (
                                <td
                                    key={c.titulo}
                                    className="border-b border-slate-200 p-3 dark:border-slate-700"
                                >
                                    {c.render(f)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            <div className="space-y-4 md:hidden">
                {filas.map((f) => (
                    <article className="panel" key={clave(f)}>
                        <dl>
                            {columnas.map((c) => (
                                <div key={c.titulo} className="mb-3">
                                    <dt className="text-sm text-slate-500 dark:text-slate-400">
                                        {c.titulo}
                                    </dt>
                                    <dd className="break-words">{c.render(f)}</dd>
                                </div>
                            ))}
                        </dl>
                    </article>
                ))}
            </div>
        </>
    );
}
