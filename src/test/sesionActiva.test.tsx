import { act, render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../features/auth/AuthContext';
import { crearQueryClient } from '../lib/queryClient';
import { credencial, guardarSesion } from '../lib/sesionStore';
import { principal, ticket } from './fixtures';

function EstadoSesion() {
  const { sesion, aviso } = useAuth();
  return (
    <output>
      {sesion.estado} {aviso}
    </output>
  );
}

test('una sesión abierta vence en el instante previsto y borra los tickets privados', async () => {
  vi.useFakeTimers();
  const q = crearQueryClient();
  try {
    guardarSesion({ token: 'sesion-de-prueba', expiraEn: Date.now() + 1000 });
    q.setQueryData(['sesion'], principal());
    q.setQueryData(['tickets', 'usuario', ticket.userEmail], [ticket]);
    render(
      <QueryClientProvider client={q}>
        <AuthProvider>
          <EstadoSesion />
        </AuthProvider>
      </QueryClientProvider>,
    );
    await act(() => vi.advanceTimersByTimeAsync(999));
    expect(screen.getByRole('status')).toHaveTextContent('autenticado');
    expect(q.getQueryData(['tickets', 'usuario', ticket.userEmail])).toEqual([
      ticket,
    ]);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(screen.getByRole('status')).toHaveTextContent(
      'anonimo Tu sesión expiró',
    );
    expect(
      q.getQueryData(['tickets', 'usuario', ticket.userEmail]),
    ).toBeUndefined();
    expect(credencial()).toBeNull();
    expect(sessionStorage.getItem('pulsepass.sesion')).toBeNull();
  } finally {
    vi.useRealTimers();
  }
});