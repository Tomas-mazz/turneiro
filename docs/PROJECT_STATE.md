# PROJECT STATE

Este archivo representa la **fuente de verdad del estado actual del proyecto**.
Cursor DEBE usar este archivo para entender qué ya está hecho, qué está en progreso
y qué NO debe volver a crear ni asumir.

---

## 1. Estado general del proyecto

- Estado actual: INICIALIZACIÓN
- Repo git: inicializado
- Rama principal: main
- Entorno: local

---

## 2. Hecho (COMPLETADO)

> Cosas ya creadas y que NO deben rehacerse.

- [x] Estructura base de carpetas (frontend/, backend/, subdirectorios según ARCHITECTURE.md)
- [x] Inicialización de repositorio git en la raíz
- [x] Configuración inicial del stack (package.json raíz, frontend, backend)
- [x] Instalación de dependencias base (install:all)
- [x] README inicial
- [x] Configuración básica de entorno (.env.example en frontend y backend; .env y .env.local creados por copia)
- [x] Frontend: next.config, tsconfig, tailwind, postcss, eslint; páginas base (layout, globals.css, auth, dashboard, public [business-slug]); lib (api, auth, utils); types
- [x] Backend: Express server (index.ts), tsconfig, eslint; rutas, controladores y servicios en stub; middleware (auth, errorHandler, validation); lib (prisma, utils)
- [x] Prisma schema completo (Business, User, Service, Appointment, WorkingHours, BlockedSlot, BusinessSettings, Subscription) con relaciones e índices
- [x] date-fns-tz actualizado a 3.2.0 en frontend y backend (compatibilidad con date-fns 3.x)
- [x] Base de datos PostgreSQL local configurada; DATABASE_URL en backend/.env; migraciones ejecutadas

Notas:
- Los controladores y servicios del backend son stubs (mensaje "Not implemented"); la lógica de negocio está pendiente.
- frontend/.env.local y backend/.env no se versionan (.gitignore).

---

## 3. En progreso

> Cosas empezadas pero NO finalizadas.

- (ninguno)

---

## 4. Pendiente inmediato (PRÓXIMOS PASOS)

> Lo siguiente que debería construirse.
> Cursor puede proponer implementación SOLO de estos puntos.

- Conectar rutas del backend a controladores y servicios (implementar lógica real)
- GET /api/businesses/:slug (perfil público del negocio)
- GET /api/availability y GET /api/availability/week
- POST /api/appointments y flujo de cancelación
- Autenticación (login, register, JWT, middleware)
- Página pública de reserva [business-slug] con flujo completo (hero, servicio, calendario, horarios, formulario cliente, aviso de cancelación, pago)
- Dashboard básico para dueños (ver citas, configuración)

---

## 5. Bloqueado / requiere decisión

> Nada de esta sección debe implementarse sin aclaración previa.

- (ninguno)

Referencia: decisiones ya tomadas en PENDING_OR_UNCERTAIN.md (pago 10% fijo, registro obligatorio antes de pago, multi-barbero deshabilitado en MVP, cancelación 24h configurable por admin).

---

## 6. Fuera de alcance por ahora (NO TOCAR)

> Features, ideas o integraciones que NO son parte del trabajo actual.

- Features premium
- Integración Google Calendar (solo Premium)
- Multi-barbero en MVP (deshabilitado)
- Automatizaciones complejas

---

## 7. Archivos de contexto activo

> Estos archivos DEBEN usarse para generar código.

- AI_RULES_FOR_CURSOR.md
- TECH_STACK.md
- ARCHITECTURE.md
- CODING_RULES.md
- FEATURES_MVP.md
- FLOWS.md
- PENDING_OR_UNCERTAIN.md

---

## 8. Archivos solo de referencia (NO usar para generar código)

- PROJECT_VISION.md
- IDEAS_FUTURE.md
- DESIGN_UX.md
- OPEN_QUESTIONS.md
