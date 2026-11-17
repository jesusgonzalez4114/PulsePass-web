import { useSearchParams } from 'react-router';
import { z } from 'zod';
import { useAuth } from '../features/auth/AuthContext';
import { useMisTickets } from '../features/tickets/hooks';
import { TicketVista } from '../features/tickets/TicketVista';
import { Datos, Boton } from '../components/ui';
import { EstadoTicket } from '../lib/validacion';
export default function MisTickets() {
  const a = useAuth();
  const q = useMisTickets(
    a.sesion.estado === 'autenticado' ? a.sesion.usuario.email : '',
  );
  const [params, setParams] = useSearchParams();
  const estado = z
    .union([z.literal(''), EstadoTicket])
    .catch('')
    .parse(params.get('estado') || '');
  return (
    <>
      <h1>Mis tickets</h1>
      <div className="mb-6 flex flex-wrap gap-2">
        {['', ...EstadoTicket.options].map((s) => (
          <Boton
            key={s}
            aria-pressed={estado === s}
            variante={estado === s ? 'primario' : 'secundario'}
            onClick={() => setParams(s ? { estado: s } : {})}
          >
            {s || 'Todos'}
          </Boton>
        ))}
      </div>
      <Datos consulta={q}>
        {(items) => {
          const visibles = items.filter((t) => !estado || t.status === estado);
          return visibles.length ? (
            <div className="space-y-4">
              {visibles.map((t) => (
                <TicketVista key={t.ticketCode} ticket={t} cancelable />
              ))}
            </div>
          ) : (
            <p role="status">No hay resultados.</p>
          );
        }}
      </Datos>
    </>
  );
}
