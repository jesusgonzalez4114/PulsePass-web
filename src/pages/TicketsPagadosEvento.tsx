import { useNavigate, useParams } from 'react-router';
import { usePagados } from '../features/tickets/hooks';
import { UsarTicket } from '../features/tickets/TicketVista';
import { Datos, Tabla } from '../components/ui';
import { BuscarCodigo } from '../components/BuscarCodigo';
import { Codigo } from '../lib/validacion';
import { RUTAS } from '../lib/rutas';
import { precioCOP } from '../lib/formato';
import NoEncontrada from './NoEncontrada';
export default function TicketsPagadosEvento() {
  const p = Codigo.safeParse(useParams().eventCode);
  const q = usePagados(p.success ? p.data : '');
  const navigate = useNavigate();
  if (!p.success) return <NoEncontrada />;
  return (
    <>
      <h1>Tickets pagados · {p.data}</h1>
      <div className="panel mb-6">
        <BuscarCodigo
          etiqueta="Código del evento"
          buscar={(c) => navigate(RUTAS.pagados(c))}
        />
      </div>
      <Datos consulta={q}>
        {(items) => (
          <>
            <p className="mb-3">Total: {items.length}</p>
            <Tabla
              filas={items}
              clave={(t) => t.ticketCode}
              columnas={[
                {
                  titulo: 'Código',
                  render: (t) => (
                    <span className="font-mono">{t.ticketCode}</span>
                  ),
                },
                { titulo: 'Usuario', render: (t) => t.userEmail },
                { titulo: 'Tipo', render: (t) => t.type },
                { titulo: 'Precio', render: (t) => precioCOP(t.price) },
                { titulo: 'Estado', render: (t) => t.status },
                {
                  titulo: 'Acción',
                  render: (t) => <UsarTicket codigo={t.ticketCode} />,
                },
              ]}
            />
          </>
        )}
      </Datos>
    </>
  );
}
