import { useAuth } from '../features/auth/AuthContext';
import {
    useUsuarioEmail,
    useUsuarioUsername,
} from '../features/usuarios/hooks';
import { Datos, Badge } from '../components/ui';
export default function Cuenta() {
    const a = useAuth();
    const user = a.sesion.estado === 'autenticado' ? a.sesion.usuario : undefined;
    const email = useUsuarioEmail(user?.email || '');
    const username = useUsuarioUsername(user?.username || '');
    return (
        <>
            <h1>Mi cuenta</h1>
            <Datos consulta={email}>
                {(u) => (
                    <section className="panel">
                        <h2>
                            {u.firstName} {u.lastName}
                        </h2>
                        <p>{u.email}</p>
                        <p>
                            {u.username} · {u.city || 'Ciudad no informada'}
                        </p>
                        {user?.roles.map((r) => (
                            <Badge key={r} texto={r} />
                        ))}
                        <p>{u.active ? 'Cuenta activa' : 'Cuenta inactiva'}</p>
                    </section>
                )}
            </Datos>
            <details className="panel mt-4">
                <summary className="py-2">Consulta por nombre de usuario</summary>
                <Datos consulta={username}>
                    {(u) => (
                        <p>
                            {u.username} · {u.email}
                        </p>
                    )}
                </Datos>
            </details>
        </>
    );
}
