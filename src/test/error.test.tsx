import { render, screen } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import ErrorPagina from '../pages/ErrorPagina';
test('GEN-002 errorElement no expone stack ni detalles', async () => {
    const router = createMemoryRouter([
        {
            path: '/',
            loader: () => {
                throw new Error('secreto interno de base de datos');
            },
            element: <p>Contenido</p>,
            errorElement: <ErrorPagina />,
            hydrateFallbackElement: <p>Cargando</p>,
        },
    ]);
    render(<RouterProvider router={router} />);
    expect(
        await screen.findByRole('heading', { name: 'Algo salió mal' }),
    ).toBeVisible();
    expect(screen.queryByText(/secreto interno/)).toBeNull();
});
