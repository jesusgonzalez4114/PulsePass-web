import { BuscarSchema } from '../lib/validacion';
import { Formulario } from './Formulario';
export function BuscarCodigo({
                                 etiqueta,
                                 buscar,
                             }: {
    etiqueta: string;
    buscar: (code: string) => void;
}) {
    return (
        <Formulario
            schema={BuscarSchema}
            campos={[{ nombre: 'codigo', etiqueta }]}
            texto="Buscar"
            enviar={async (v) => buscar(v.codigo)}
        />
    );
}
