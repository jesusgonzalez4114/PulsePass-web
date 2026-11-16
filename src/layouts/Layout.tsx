import { useState, useEffect } from 'react';
import { z } from 'zod';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router';
import { useAuth } from '../features/auth/AuthContext';
import { RUTAS } from '../lib/rutas';
import { Boton, Aviso } from '../components/ui';
function temaInicial() {
    try {
        const raw = sessionStorage.getItem('pulsepass.tema');
        const p = z.enum(['claro', 'oscuro']).safeParse(raw);
        if (p.success) return p.data === 'oscuro';
    } catch {
        /* Preferencia del sistema. */
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
export default function Layout() {
    const [menu, setMenu] = useState(false);
    const [dark, setDark] = useState(temaInicial);
    const a = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
        try {
            sessionStorage.setItem('pulsepass.tema', dark ? 'oscuro' : 'claro');
        } catch {
            /* No requiere persistencia. */
        }
    }, [dark]);
    useEffect(() => {
        setMenu(false);
    }, [location.pathname]);
    useEffect(() => {
        if (a.aviso && location.pathname !== RUTAS.login)
            navigate(RUTAS.login, {
                replace: true,
                state: { desde: location.pathname + location.search },
            });
    }, [a.aviso, location.pathname, location.search, navigate]);
    const enlaces: [[string, string], ...[string, string][]] = [
        ['Eventos', RUTAS.eventos],
        ['Artistas', RUTAS.artistas],
        ['Sedes', RUTAS.sedes],
    ];
    if (a.tieneRol('ADMIN')) enlaces.push(['Administrar eventos', RUTAS.admin]);
    return (
        <>
            <a href="#contenido" className="sr-only focus:not-sr-only">
                Saltar al contenido
            </a>
            <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
                    <NavLink
                        end
                        to={RUTAS.inicio}
                        className="font-titulo text-marca-700 text-xl dark:text-indigo-300"
                    >
                        PulsePass
                    </NavLink>
                    <Boton
                        id="menu-boton"
                        className="ml-auto md:hidden"
                        variante="secundario"
                        aria-label={menu ? 'Cerrar menú' : 'Abrir menú'}
                        aria-expanded={menu}
                        aria-controls="menu"
                        onClick={() => setMenu(!menu)}
                    >
                        Menú
                    </Boton>
                    <nav
                        id="menu"
                        aria-label="Navegación principal"
                        className={`${menu ? 'flex' : 'hidden'} w-full flex-wrap items-center gap-3 md:flex md:w-auto md:flex-1`}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setMenu(false);
                                document.getElementById('menu-boton')?.focus();
                            }
                        }}
                    >
                        {enlaces.map(([label, to]) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `rounded px-2 py-3 text-sm ${isActive ? 'bg-marca-50 text-marca-700 dark:bg-indigo-950 dark:text-indigo-200' : ''}`
                                }
                            >
                                {label}
                            </NavLink>
                        ))}
                        {a.sesion.estado === 'autenticado' ? (
                            <>
                                <NavLink className="enlace" to={RUTAS.cuenta}>
                                    {a.sesion.usuario.username}
                                </NavLink>
                                <Boton
                                    variante="fantasma"
                                    onClick={() => {
                                        a.cerrarSesion();
                                        navigate(RUTAS.inicio);
                                    }}
                                >
                                    Salir
                                </Boton>
                            </>
                        ) : (
                            <>
                                <NavLink className="enlace" to={RUTAS.login}>
                                    Ingresar
                                </NavLink>
                                <NavLink className="enlace" to={RUTAS.registro}>
                                    Registrarse
                                </NavLink>
                            </>
                        )}
                        <Boton
                            variante="secundario"
                            aria-pressed={dark}
                            onClick={() => setDark(!dark)}
                        >
                            Modo {dark ? 'claro' : 'oscuro'}
                        </Boton>
                    </nav>
                </div>
            </header>
            <main
                id="contenido"
                className="mx-auto min-h-[75dvh] max-w-6xl px-4 py-8"
            >
                {a.aviso && <Aviso>{a.aviso}</Aviso>}
                <Outlet />
            </main>
            <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4 py-8 text-sm text-slate-600 dark:text-slate-400">
                <p>PulsePass · Caso de estudio académico</p>
                <Link className="enlace" to={RUTAS.inicio}>
                    Volver al inicio
                </Link>
            </footer>
        </>
    );
}
