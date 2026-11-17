# PulsePass Web

Cliente académico React + TypeScript + Tailwind para el backend del ZIP `pulsepass-develop.zip`.

## Ejecutar

Requisitos: Node 22.22 o superior, npm y API disponible en `http://localhost:8080`.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Abrir http://localhost:5173. El proxy de Vite lleva `/api` a `http://localhost:8080`.
`VITE_API_BASE_URL=/api` es configuración pública: nunca colocar secretos aquí.

```powershell
npm run lint
npm run build
npm test
npm run test:watch
npm run format
```

`npm run preview` muestra `dist` para inspeccionar el build. El proxy está configurado solo para desarrollo; no se promete conexión a la API desde preview. Para publicar se necesita mismo origen con reverse proxy y fallback a index.html. El despliegue productivo queda fuera del PRD.

## Rutas

- Públicas: `/`, `/eventos`, `/eventos/:eventCode`, `/artistas`, `/artistas/:id`, `/sedes`, `/sedes/:code`, `/login`, `/registro`.
- Autenticada: `/cuenta`.
- USER: `/mis-tickets`, `/mis-tickets/:ticketCode`, `/compra/confirmacion/:ticketCode`.
- STAFF o ADMIN: `/staff/validacion`, `/staff/eventos/:eventCode/tickets`.
- ADMIN: `/admin/eventos`, `/admin/eventos/nuevo`, `/admin/eventos/:eventCode`.
- Errores: `/403`, ruta comodín 404 y `errorElement` seguro.

## Roles de demostración

Usar una base local separada `pulsepass_e2e` y el fixture del backend `tests/e2e/fixtures/seed-e2e.sql`, según la guía. El fixture se ejecuta una sola vez después de Flyway. No es una migración ni se ejecuta sobre una base con trabajo previo.

| Usuario                      | Rol   | Contraseña                               |
| ---------------------------- | ----- | ---------------------------------------- |
| Cuenta creada desde Registro | USER  | La elegida al registrar                  |
| e2e_staff                    | STAFF | La suministrada como staff_pw al fixture |
| e2e_admin                    | ADMIN | La suministrada como admin_pw al fixture |

Las contraseñas no están en este repositorio. Registrar una cuenta crea exclusivamente USER. El frontend no asigna roles.

## Decisiones del contrato

- `EventSummaryResponse` no contiene `category`; `useCatalogo` consulta detalles en caché para completar categorías. Hay N+1 peticiones en la primera carga: es una solución académica, sin modificar el backend.
- `/auth/me` devuelve `roles: string[]`. El cliente no presupone un rol único.
- `UserResponse` no contiene `birthDate`; se envía en registro, pero no se inventa al mostrar la cuenta.
- Los artistas del evento son nombres, no objetos. Se resuelven mediante `by-stage-name` cuando se necesita enlazarlos.
- El backend oculta con 404 todo evento no PUBLISHED a quien no sea STAFF/ADMIN. Un SOLD_OUT puede desaparecer del detalle para USER.
- `LocalDateTime` se envía sin `Z`. No se hace una conversión UTC artificial.
- El precio llega únicamente de TicketResponse; no se envía ni se calcula en la compra.
- JWT en memoria/sessionStorage, limpieza de caché al salir, cancelación de consultas y manejo central de 401. No hay refresh token.

## Pruebas y diseño

Las pruebas usan Vitest, Testing Library y MSW, sin backend real. Los datos de `src/test` son ficticios y no se importan en producción. Las referencias visuales están en la sección 9 del PRD. Si ya tienen las imágenes por separado, pueden guardarlas en `docs/diseno/`.

Validar manualmente contra la API: registro/login, permisos, aforo, edad, compra, cancelación, usar ticket dos veces, publicación y asociación duplicada. Revisar 360/390/768/1280 px, modo oscuro, teclado, foco en modales y Lighthouse/axe. No se certifica WCAG por pasar pruebas de JSDOM.
