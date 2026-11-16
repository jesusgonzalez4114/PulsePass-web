import { useQuery } from '@tanstack/react-query';
import * as api from './api';
export const useUsuarioEmail = (email: string) =>
    useQuery({
        queryKey: ['usuario', 'email', email],
        queryFn: ({ signal }) => api.porEmail(email, signal),
        enabled: !!email,
    });
export const useUsuarioUsername = (username: string) =>
    useQuery({
        queryKey: ['usuario', 'username', username],
        queryFn: ({ signal }) => api.porUsername(username, signal),
        enabled: !!username,
    });
