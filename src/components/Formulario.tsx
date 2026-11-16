import { useId, useState, type ReactNode } from 'react';
import {
    useForm,
    type FieldValues,
    type Path,
    type DefaultValues,
    type Resolver,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiError, mensaje } from '../lib/http';
import { Boton, Aviso } from './ui';
export interface Campo<T extends FieldValues> {
    nombre: Path<T>;
    etiqueta: string;
    tipo?:
        | 'text'
        | 'email'
        | 'password'
        | 'date'
        | 'datetime-local'
        | 'number'
        | 'textarea'
        | 'select';
    opciones?: { value: string; label: string }[];
    autoComplete?: string;
}
interface Props<T extends FieldValues> {
    schema: z.ZodType<T, T>;
    campos: Campo<T>[];
    inicial?: DefaultValues<T>;
    enviar: (data: T) => Promise<unknown>;
    texto?: string;
    children?: ReactNode;
}
export function Formulario<T extends FieldValues>({
                                                      schema,
                                                      campos,
                                                      inicial,
                                                      enviar,
                                                      texto = 'Guardar',
                                                      children,
                                                  }: Props<T>) {
    const id = useId();
    const [visible, setVisible] = useState(false);
    const {
        register,
        handleSubmit,
        setError,
        clearErrors,
        getFieldState,
        formState,
    } = useForm<T>({
        resolver: zodResolver(schema) as Resolver<T>,
        defaultValues: inicial,
    });
    const submit = handleSubmit(async (data) => {
        clearErrors();
        try {
            await enviar(data);
        } catch (e) {
            const generales: string[] = [];
            if (e instanceof ApiError && e.status === 400)
                Object.entries(e.details).forEach(([key, value]) => {
                    const campo = campos.find((c) => c.nombre === key);
                    if (campo) setError(campo.nombre, { message: value });
                    else generales.push(value);
                });
            setError('root', { message: [mensaje(e), ...generales].join(' ') });
        }
    });
    return (
        <form noValidate onSubmit={submit} className="space-y-4">
            {campos.map((c) => {
                const fieldId = `${id}-${c.nombre}`;
                const error = getFieldState(c.nombre, formState).error;
                const reg = register(c.nombre, {
                    valueAsNumber: c.tipo === 'number',
                    setValueAs:
                        c.tipo === 'datetime-local'
                            ? (v: unknown) =>
                                typeof v === 'string' && v.length === 16 ? `${v}:00` : v
                            : undefined,
                });
                const common = {
                    id: fieldId,
                    'aria-invalid': !!error,
                    'aria-describedby': error ? `${fieldId}-error` : undefined,
                    ...reg,
                };
                return (
                    <div key={c.nombre}>
                        <label
                            htmlFor={fieldId}
                            className="mb-1 block text-sm font-semibold"
                        >
                            {c.etiqueta}
                        </label>
                        {c.tipo === 'select' ? (
                            <select {...common}>
                                <option value="">Selecciona…</option>
                                {c.opciones?.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        ) : c.tipo === 'textarea' ? (
                            <textarea {...common} rows={4} />
                        ) : (
                            <input
                                {...common}
                                type={
                                    c.tipo === 'password' && visible ? 'text' : c.tipo || 'text'
                                }
                                autoComplete={c.autoComplete}
                                step={c.tipo === 'number' ? 1 : undefined}
                            />
                        )}
                        {c.tipo === 'password' && (
                            <Boton
                                variante="fantasma"
                                aria-pressed={visible}
                                onClick={() => setVisible(!visible)}
                            >
                                {visible ? 'Ocultar' : 'Mostrar'} contraseña
                            </Boton>
                        )}
                        {error && (
                            <p
                                id={`${fieldId}-error`}
                                role="alert"
                                className="mt-1 text-sm text-red-700 dark:text-red-300"
                            >
                                {error.message}
                            </p>
                        )}
                    </div>
                );
            })}
            {formState.errors.root?.message && (
                <Aviso error>{formState.errors.root.message}</Aviso>
            )}
            {children}
            <Boton type="submit" cargando={formState.isSubmitting}>
                {texto}
            </Boton>
        </form>
    );
}
