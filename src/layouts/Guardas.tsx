import { useIsMutating } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../features/auth/AuthContext';
import { RUTAS } from '../lib/rutas';
import { regresoSeguro, type Rol } from '../lib/validacion';
import { Aviso, Boton } from '../components/ui';
export function RutaProtegida() {
    const a = useAuth();
    const location = useLocation();
    if (a.sesion.estado === 'cargando')
        return <p role="status">Restaurando sesión…</p>;
    if (a.sesion.estado === 'error')
        return (
            <>
                <Aviso error>No pudimos comprobar la sesión.</Aviso>
                <Boton onClick={a.reintentar}>Reintentar</Boton>
                <Boton onClick={() => a.cerrarSesion()}>Cerrar sesión</Boton>
            </>
        );
    return a.sesion.estado === 'autenticado' ? (
        <Outlet />
    ) : (
        <Navigate
            to={RUTAS.login}
            replace
            state={{ desde: location.pathname + location.search }}
        />
    );
}
export function RutaPorRol({ roles }: { roles: Rol[] }) {
    const a = useAuth();
    return a.tieneRol(...roles) ? (
        <Outlet />
    ) : (
        <Navigate to={RUTAS.sinPermisos} replace />
    );
}
export function SoloAnonimo() {
    const a = useAuth();
    const location = useLocation();
    const ingresando = useIsMutating({ mutationKey: ['auth', 'login'] }) > 0;
    if (ingresando) return <Outlet />;
    if (a.sesion.estado === 'cargando')
        return <p role="status">Restaurando sesión…</p>;
    return a.sesion.estado === 'autenticado' ? (
        <Navigate to={regresoSeguro(location.state)} replace />
    ) : (
        <Outlet />
    );
}
