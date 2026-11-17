import { useParams } from 'react-router';
import { Codigo } from '../lib/validacion';
import { useTicket } from '../features/tickets/hooks';
import { TicketVista } from '../features/tickets/TicketVista';
import { Datos } from '../components/ui';
import NoEncontrada from './NoEncontrada';
export default function DetalleTicket() {
  const p = Codigo.safeParse(useParams().ticketCode);
  const q = useTicket(p.success ? p.data : '');
  if (!p.success) return <NoEncontrada />;
  return (
    <>
      <h1>Detalle del ticket</h1>
      <Datos consulta={q} noDisponible="Ticket no disponible">
        {(t) => <TicketVista ticket={t} cancelable />}
      </Datos>
    </>
  );
}
