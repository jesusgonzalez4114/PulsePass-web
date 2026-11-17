import { useState } from 'react';
import { Link } from 'react-router';
import { useCancelar, useUsar } from './hooks';
import type { Ticket } from './tipos';
import { Boton, Modal, Aviso, Badge } from '../../components/ui';
import { fecha, precioCOP } from '../../lib/formato';
import { mensaje } from '../../lib/http';
import { RUTAS } from '../../lib/rutas';
export function CancelarTicket({ ticket }: { ticket: Ticket }) {
  const [abierto, setAbierto] = useState(false);
  const m = useCancelar();
  if (ticket.status !== 'PAID') return null;
  return (
    <>
      <Boton
        variante="peligro"
        onClick={() => {
          m.reset();
          setAbierto(true);
        }}
      >
        Cancelar ticket
      </Boton>
      {abierto && (
        <Modal
          titulo="Cancelar ticket"
          ocupado={m.isPending}
          cerrar={() => setAbierto(false)}
        >
          <p>
            ¿Deseas cancelar el ticket{' '}
            <span className="font-mono">{ticket.ticketCode}</span> de{' '}
            {ticket.eventName}?
          </p>
          {m.isError && <Aviso error>{mensaje(m.error)}</Aviso>}
          <div className="mt-5 flex gap-3">
            <Boton
              variante="secundario"
              disabled={m.isPending}
              onClick={() => setAbierto(false)}
            >
              Volver
            </Boton>
            <Boton
              variante="peligro"
              cargando={m.isPending}
              onClick={() =>
                m.mutate(ticket.ticketCode, {
                  onSuccess: () => setAbierto(false),
                })
              }
            >
              Confirmar cancelación
            </Boton>
          </div>
        </Modal>
      )}
    </>
  );
}
export function UsarTicket({ codigo }: { codigo: string }) {
  const m = useUsar();
  return (
    <>
      <Boton cargando={m.isPending} onClick={() => m.mutate(codigo)}>
        Marcar como usado
      </Boton>
      {m.isSuccess && <Aviso>Ingreso registrado.</Aviso>}
      {m.isError && <Aviso error>{mensaje(m.error)}</Aviso>}
    </>
  );
}
export function TicketVista({
  ticket: t,
  cancelable = false,
}: {
  ticket: Ticket;
  cancelable?: boolean;
}) {
  return (
    <article className="panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2>{t.eventName}</h2>
        <Badge texto={t.status} />
      </div>
      <dl className="mb-5 grid gap-3 sm:grid-cols-2">
        <div>
          <dt>Código</dt>
          <dd className="font-mono break-all">{t.ticketCode}</dd>
        </div>
        <div>
          <dt>Tipo</dt>
          <dd>{t.type}</dd>
        </div>
        <div>
          <dt>Precio confirmado</dt>
          <dd>{precioCOP(t.price)}</dd>
        </div>
        <div>
          <dt>Compra</dt>
          <dd>{fecha(t.purchaseDate)}</dd>
        </div>
        <div>
          <dt>Correo</dt>
          <dd className="break-all">{t.userEmail}</dd>
        </div>
        <div>
          <dt>Evento</dt>
          <dd className="font-mono">{t.eventCode}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-4">
        <Link className="enlace" to={RUTAS.ticket(t.ticketCode)}>
          Ver ticket
        </Link>
        {cancelable && <CancelarTicket ticket={t} />}
      </div>
    </article>
  );
}
