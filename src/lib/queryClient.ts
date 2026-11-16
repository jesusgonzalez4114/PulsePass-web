import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './http';
export const crearQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60000,
                retry: (n, e) =>
                    n < 1 && e instanceof ApiError && (e.status === 0 || e.status >= 500),
                refetchOnWindowFocus: false,
            },
            mutations: { retry: false },
        },
    });
export const queryClient = crearQueryClient();
