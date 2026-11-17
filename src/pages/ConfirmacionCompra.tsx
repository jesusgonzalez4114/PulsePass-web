import { Link, useParams } from 'react-router';
import { Codigo } from '../lib/validacion';
import { RUTAS } from '../lib/rutas';
import { useTicket } from '../features/tickets/hooks';
import { TicketVista } from '../features/tickets/TicketVista';
import { Datos } from '../components/ui';
import NoEncontrada from './NoEncontrada';
export default function ConfirmacionCompra() {
  const p = Codigo.safeParse(useParams().ticketCode);
  const q = useTicket(p.success ? p.data : '');
  if (!p.success) return <NoEncontrada />;
  return (
    <div className="estrecho">
      <h1>Confirmación de compra</h1>
      <Datos consulta={q} noDisponible="Ticket no disponible">
        {(t) => (
          <>
            <p role="status" className="mb-5">
              Compra registrada. Estado actual: {t.status}.
            </p>
            <TicketVista ticket={t} />
            <Link className="enlace" to={RUTAS.tickets}>
              Ver mis tickets
            </Link>
          </>
        )}
      </Datos>
    </div>
  );
}
