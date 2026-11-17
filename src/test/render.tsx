import { render } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { crearQueryClient } from '../lib/queryClient';
import { AuthProvider } from '../features/auth/AuthContext';
import { guardarSesion } from '../lib/sesionStore';
import { routes } from '../router';
import type { Rol } from '../lib/validacion';
import { base, server, principal } from './fixtures';
export function app(
  path: string,
  roles: Rol[] | null = null,
  state: unknown = null,
) {
  if (roles) {
    guardarSesion({ token: 'fake-token', expiraEn: Date.now() + 900000 });
    server.use(
      http.get(`${base}/auth/me`, () => HttpResponse.json(principal(roles))),
    );
  }
  const q = crearQueryClient();
  q.setDefaultOptions({
    queries: { retry: false, staleTime: Infinity },
    mutations: { retry: false },
  });
  const router = createMemoryRouter(routes, {
    initialEntries: [
      {
        pathname: path.split('?')[0],
        search: path.includes('?') ? '?' + path.split('?')[1] : '',
        state,
      },
    ],
  });
  const view = render(
    <QueryClientProvider client={q}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { ...view, q, router };
}
