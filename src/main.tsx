import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/AuthContext';
import { queryClient } from './lib/queryClient';
import { crearRouter } from './router';
import './index.css';
const router = crearRouter();
const root = document.getElementById('root');
if (!root) throw new Error('Falta el contenedor root');
createRoot(root).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </QueryClientProvider>
    </StrictMode>,
);
