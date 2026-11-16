export const precioCOP = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(
        value,
    );
// LocalDateTime no tiene zona: se muestra la hora local del evento sin añadir Z.
export const fecha = (value: string) =>
    new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
