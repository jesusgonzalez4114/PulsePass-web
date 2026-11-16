import { useQuery } from '@tanstack/react-query';
import * as api from './api';
export const useSedes = () =>
    useQuery({
        queryKey: ['sedes', 'activas'],
        queryFn: ({ signal }) => api.activas(signal),
        staleTime: 300000,
    });
export const useSede = (code: string) =>
    useQuery({
        queryKey: ['sede', code],
        queryFn: ({ signal }) => api.sede(code, signal),
        enabled: !!code,
        staleTime: 300000,
    });
