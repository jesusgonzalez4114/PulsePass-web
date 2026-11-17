import { useState } from 'react';
import { BuscarCodigo } from '../components/BuscarCodigo';
import { Datos } from '../components/ui';
import { useTicket } from '../features/tickets/hooks';
import { TicketVista, UsarTicket } from '../features/tickets/TicketVista';
function Resultado({ codigo }: { codigo: string }) {
  const q = useTicket(codigo);
  return (
    <Datos consulta={q} noDisponible="Ticket no disponible">
      {(t) => (
        <div className="mt-6 space-y-4">
          <TicketVista ticket={t} />
          <UsarTicket codigo={t.ticketCode} />
        </div>
      )}
    </Datos>
  );
}
export default function ValidacionIngreso() {
  const [code, setCode] = useState('');
  return (
    <div className="estrecho">
      <h1>Validación de ingreso</h1>
      <BuscarCodigo etiqueta="Código del ticket" buscar={setCode} />
      {code && <Resultado key={code} codigo={code} />}
    </div>
  );
}
