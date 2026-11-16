import { createRoot } from 'react-dom/client';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Falta el contenedor raíz de PulsePass');
}

createRoot(rootElement).render(<h1>PulsePass · Preparación del frontend</h1>);
