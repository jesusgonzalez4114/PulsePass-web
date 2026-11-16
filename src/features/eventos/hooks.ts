import {
    useQuery,
    useQueries,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import * as api from './api';
import { ApiError } from '../../lib/http';
export const useEvento = (code: string) =>
    useQuery({
        queryKey: ['evento', code],
        queryFn: ({ signal }) => api.evento(code, signal),
        enabled: !!code,
        staleTime: 30000,
    });
export const usePublicados = () =>
    useQuery({
        queryKey: ['eventos', 'publicados'],
        queryFn: ({ signal }) => api.publicados(signal),
    });
export const usePorArtista = (name: string) =>
    useQuery({
        queryKey: ['eventos', 'artista', name],
        queryFn: ({ signal }) => api.porArtista(name, signal),
        enabled: !!name,
    });
// El DTO resumido no tiene categoría. Enriquecemos con detalles cacheados.
// Si se despublica entre ambas consultas, descartamos solamente ese 404.
export function useCatalogo(name = '') {
    const listado = useQuery({
        queryKey: name ? ['eventos', 'artista', name] : ['eventos', 'publicados'],
        queryFn: ({ signal }) =>
            name ? api.porArtista(name, signal) : api.publicados(signal),
    });
    const detalles = useQueries({
        queries: (listado.data || []).map((x) => ({
            queryKey: ['evento', x.eventCode],
            queryFn: ({ signal }: { signal: AbortSignal }) =>
                api.evento(x.eventCode, signal),
            staleTime: 30000,
        })),
    });
    const error =
        listado.error ||
        detalles.find(
            (x) =>
                x.error && !(x.error instanceof ApiError && x.error.status === 404),
        )?.error;
    return {
        status: error
            ? ('error' as const)
            : listado.isPending || detalles.some((x) => x.isPending)
                ? ('pending' as const)
                : ('success' as const),
        error,
        data: detalles.flatMap((x) => (x.data ? [x.data] : [])),
        refetch: () => {
            void listado.refetch();
            detalles.forEach((x) => {
                void x.refetch();
            });
        },
    };
}
export function useCrearEvento() {
    const q = useQueryClient();
    return useMutation({
        mutationFn: api.crear,
        onSuccess: (e) => {
            q.setQueryData(['evento', e.eventCode], e);
        },
    });
}
export function usePublicar() {
    const q = useQueryClient();
    return useMutation({
        mutationFn: api.publicar,
        onSuccess: async (e) => {
            q.setQueryData(['evento', e.eventCode], e);
            await q.invalidateQueries({ queryKey: ['eventos'] });
        },
    });
}
export function useAsociar() {
    const q = useQueryClient();
    return useMutation({
        mutationFn: api.asociar,
        onSuccess: async (e) => {
            q.setQueryData(['evento', e.eventCode], e);
            await q.invalidateQueries({ queryKey: ['eventos', 'artista'] });
        },
    });
}
