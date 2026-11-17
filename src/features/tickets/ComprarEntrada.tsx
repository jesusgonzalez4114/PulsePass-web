import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import type { Evento } from '../eventos/tipos';
import { useComprar } from './hooks';
import { CompraSchema } from './tipos';
import { TipoTicket } from '../../lib/validacion';
import { RUTAS } from '../../lib/rutas';
import { Boton, Modal } from '../../components/ui';
import { Formulario } from '../../components/Formulario';
export default function ComprarEntrada({ evento }: { evento: Evento }) {
  const [abierto, setAbierto] = useState(false);
  const a = useAuth();
  const comprar = useComprar();
  const navigate = useNavigate();
  const location = useLocation();
  const abrir = () => {
    if (a.sesion.estado !== 'autenticado') {
      navigate(RUTAS.login, {
        state: { desde: location.pathname + location.search },
      });
      return;
    }
    setAbierto(true);
  };
  const permitido = a.sesion.estado === 'anonimo' || a.tieneRol('USER');
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white p-4 md:static md:rounded-xl md:border md:p-5 dark:bg-slate-900">
        <h2 className="hidden md:block">Entradas</h2>
        <p className="mb-3 text-sm">
          El precio se confirma al completar la compra. Sin pagos reales.
        </p>
        <Boton
          className="w-full"
          disabled={evento.status !== 'PUBLISHED' || !permitido}
          onClick={abrir}
        >
          Comprar entrada
        </Boton>
      </div>
      {abierto && (
        <Modal
          titulo="Confirmar compra"
          cerrar={() => setAbierto(false)}
          ocupado={comprar.isPending}
        >
          <p className="mb-4">{evento.name}</p>
          <Formulario
            schema={CompraSchema}
            inicial={{ type: 'GENERAL' as const }}
            campos={[
              {
                nombre: 'type',
                etiqueta: 'Tipo de entrada',
                tipo: 'select',
                opciones: TipoTicket.options.map((value) => ({
                  value,
                  label: value,
                })),
              },
            ]}
            texto="Confirmar compra"
            enviar={async (v) => {
              if (a.sesion.estado !== 'autenticado') return;
              const t = await comprar.mutateAsync({
                type: v.type,
                eventCode: evento.eventCode,
                userEmail: a.sesion.usuario.email,
              });
              navigate(RUTAS.confirmacion(t.ticketCode));
            }}
          />
        </Modal>
      )}
    </>
  );
}
