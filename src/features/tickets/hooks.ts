import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
export const useTicket = (code: string) =>
  useQuery({
    queryKey: ['ticket', code],
    queryFn: ({ signal }) => api.ticket(code, signal),
    enabled: !!code,
    staleTime: 15000,
  });
export const useMisTickets = (email: string) =>
  useQuery({
    queryKey: ['tickets', 'usuario', email],
    queryFn: ({ signal }) => api.propios(email, signal),
    enabled: !!email,
    staleTime: 15000,
  });
export const usePagados = (code: string) =>
  useQuery({
    queryKey: ['tickets', 'pagados', code],
    queryFn: ({ signal }) => api.pagados(code, signal),
    enabled: !!code,
    staleTime: 15000,
  });
function useCambio<T>(fn: (v: T) => ReturnType<typeof api.comprar>) {
  const q = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (t) => {
      q.setQueryData(['ticket', t.ticketCode], t);
      await Promise.all([
        q.invalidateQueries({ queryKey: ['tickets'] }),
        q.invalidateQueries({ queryKey: ['evento', t.eventCode] }),
        q.invalidateQueries({ queryKey: ['eventos'] }),
      ]);
    },
  });
}
export const useComprar = () => useCambio(api.comprar);
export const useCancelar = () => useCambio(api.cancelar);
export const useUsar = () => useCambio(api.usar);
