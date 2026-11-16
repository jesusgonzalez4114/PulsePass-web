import { createBrowserRouter, type RouteObject } from 'react-router';
import Layout from './layouts/Layout';
import { RutaProtegida, RutaPorRol, SoloAnonimo } from './layouts/Guardas';
import Inicio from './pages/Inicio';
import ErrorPagina from './pages/ErrorPagina';
import { RUTAS as R } from './lib/rutas';
export const routes: RouteObject[] = [
    {
        path: R.inicio,
        Component: Layout,
        hydrateFallbackElement: <p role="status">Cargando aplicación…</p>,
        errorElement: <ErrorPagina />,
        children: [
            { index: true, Component: Inicio },
            {
                path: R.eventos,
                lazy: async () => ({
                    Component: (await import('./pages/CatalogoEventos')).default,
                }),
            },
            {
                path: R.eventoPatron,
                lazy: async () => ({
                    Component: (await import('./pages/DetalleEvento')).default,
                }),
            },
            {
                path: R.artistas,
                lazy: async () => ({
                    Component: (await import('./pages/ListaArtistas')).default,
                }),
            },
            {
                path: R.artistaPatron,
                lazy: async () => ({
                    Component: (await import('./pages/DetalleArtista')).default,
                }),
            },
            {
                path: R.sedes,
                lazy: async () => ({
                    Component: (await import('./pages/ListaSedes')).default,
                }),
            },
            {
                path: R.sedePatron,
                lazy: async () => ({
                    Component: (await import('./pages/DetalleSede')).default,
                }),
            },
            {
                Component: SoloAnonimo,
                children: [
                    {
                        path: R.login,
                        lazy: async () => ({
                            Component: (await import('./pages/Login')).default,
                        }),
                    },
                    {
                        path: R.registro,
                        lazy: async () => ({
                            Component: (await import('./pages/Registro')).default,
                        }),
                    },
                ],
            },
            {
                Component: RutaProtegida,
                children: [
                    {
                        path: R.cuenta,
                        lazy: async () => ({
                            Component: (await import('./pages/Cuenta')).default,
                        }),
                    },
                    {
                        element: <RutaPorRol roles={['ADMIN']} />,
                        children: [
                            {
                                path: R.admin,
                                lazy: async () => ({
                                    Component: (await import('./pages/AdminEventos')).default,
                                }),
                            },
                            {
                                path: R.nuevo,
                                lazy: async () => ({
                                    Component: (await import('./pages/AdminCrearEvento')).default,
                                }),
                            },
                            {
                                path: R.gestionPatron,
                                lazy: async () => ({
                                    Component: (await import('./pages/AdminGestionEvento'))
                                        .default,
                                }),
                            },
                        ],
                    },
                ],
            },
            {
                path: R.sinPermisos,
                lazy: async () => ({
                    Component: (await import('./pages/SinPermisos')).default,
                }),
            },
            {
                path: R.noEncontrada,
                lazy: async () => ({
                    Component: (await import('./pages/NoEncontrada')).default,
                }),
            },
        ],
    },
];
export const crearRouter = () => createBrowserRouter(routes);
