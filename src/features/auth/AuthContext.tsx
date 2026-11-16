import {
    createContext,
    useContext,
    useEffect,
    useSyncExternalStore,
    useCallback,
    useState,
    type ReactNode,
} from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
    credencial,
    suscribir,
    guardarSesion,
    type Credencial,
} from '../../lib/sesionStore';
import { ApiError } from '../../lib/http';
import type { Rol } from '../../lib/validacion';
import type { Principal, Login } from './tipos';
import * as api from './api';
type Sesion =
    | { estado: 'cargando' }
    | { estado: 'anonimo' }
    | { estado: 'error'; error: unknown }
    | { estado: 'autenticado'; usuario: Principal; expiraEn: number };
interface Auth {
    sesion: Sesion;
    aviso: string;
    iniciarSesion: (v: Login) => Promise<void>;
    cerrarSesion: (expirada?: boolean) => void;
    tieneRol: (...roles: Rol[]) => boolean;
    reintentar: () => void;
}
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
    const q = useQueryClient();
    const c = useSyncExternalStore(suscribir, credencial, () => null);
    const [aviso, setAviso] = useState('');
    const cerrarSesion = useCallback(
        (expirada = false) => {
            guardarSesion(null);
            void q.cancelQueries();
            q.clear();
            setAviso(expirada ? 'Tu sesión expiró' : '');
        },
        [q],
    );
    useEffect(() => {
        const salir = () => cerrarSesion(true);
        window.addEventListener('pulsepass:401', salir);
        return () => window.removeEventListener('pulsepass:401', salir);
    }, [cerrarSesion]);
    useEffect(() => {
        if (!c) return;
        const timer = window.setTimeout(
            () => cerrarSesion(true),
            Math.max(0, c.expiraEn - Date.now()),
        );
        return () => clearTimeout(timer);
    }, [c, cerrarSesion]);
    const me = useQuery({
        queryKey: ['sesion'],
        queryFn: ({ signal }) => api.me(signal),
        enabled: !!c,
        staleTime: Infinity,
        retry: false,
    });
    const iniciarSesion = async (values: Login) => {
        const token = await api.login(values);
        await q.cancelQueries();
        q.getQueryCache().clear();
        setAviso('');
        const nueva: Credencial = {
            token: token.accessToken,
            expiraEn: Date.now() + token.expiresIn * 1000,
        };
        guardarSesion(nueva);
        try {
            await q.fetchQuery({
                queryKey: ['sesion'],
                queryFn: ({ signal }) => api.me(signal),
                staleTime: Infinity,
                retry: false,
            });
        } catch (e) {
            cerrarSesion(e instanceof ApiError && e.status === 401);
            throw e;
        }
    };
    const sesion: Sesion = !c
        ? { estado: 'anonimo' }
        : me.isPending
            ? { estado: 'cargando' }
            : me.isError
                ? { estado: 'error', error: me.error }
                : { estado: 'autenticado', usuario: me.data, expiraEn: c.expiraEn };
    return (
        <Context.Provider
            value={{
                sesion,
                aviso,
                iniciarSesion,
                cerrarSesion,
                tieneRol: (...roles) =>
                    sesion.estado === 'autenticado' &&
                    roles.some((r) => sesion.usuario.roles.includes(r)),
                reintentar: () => {
                    void me.refetch();
                },
            }}
        >
            {children}
        </Context.Provider>
    );
}
export function useAuth() {
    const value = useContext(Context);
    if (!value) throw new Error('Falta AuthProvider');
    return value;
}
export function useLogin() {
    const { iniciarSesion } = useAuth();
    return useMutation({
        mutationKey: ['auth', 'login'],
        mutationFn: iniciarSesion,
    });
}
export const useRegistro = () => useMutation({ mutationFn: api.registro });
