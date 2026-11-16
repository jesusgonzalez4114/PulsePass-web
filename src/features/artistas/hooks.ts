import { useQuery } from '@tanstack/react-query';
import * as api from './api';
export const useArtistas = () =>
    useQuery({
        queryKey: ['artistas', 'activos'],
        queryFn: ({ signal }) => api.activos(signal),
        staleTime: 300000,
    });
export const useArtista = (id: number) =>
    useQuery({
        queryKey: ['artista', id],
        queryFn: ({ signal }) => api.artista(id, signal),
        enabled: id > 0,
        staleTime: 300000,
    });
export const useArtistaNombre = (name: string) =>
    useQuery({
        queryKey: ['artista', 'nombre', name],
        queryFn: ({ signal }) => api.porNombre(name, signal),
        enabled: !!name,
        staleTime: 300000,
    });
