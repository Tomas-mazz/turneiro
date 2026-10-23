# Desplegar el backend en Vercel

El backend está preparado para correr como serverless en Vercel.

## Pasos manuales (después de push)

1. **Nuevo proyecto en Vercel**
   - Vercel → Add New → Project → mismo repo de GitHub.
   - **Root Directory:** `backend` (importante).
   - Deploy.

2. **Variables de entorno (proyecto backend en Vercel)**
   - Settings → Environment Variables. Añadir al menos:
     - `DATABASE_URL` — PostgreSQL en la nube. Con **Supabase**: suele ser el **Transaction pooler** (puerto **6543**).
    - `DIRECT_URL` — **Recomendado** con el `schema.prisma` actual (`directUrl`). Con **Supabase**: conexión **directa** (puerto **5432**), mismo proyecto y misma contraseña que `DATABASE_URL`. La copiás de Supabase → Project Settings → Database → *Direct connection* / URI en 5432.
     - `FRONTEND_URL` — `https://www.turneiro.com` (o la URL de tu frontend).
     - `JWT_SECRET` — mismo que en local.
   - Opcional: `INIT_ADMIN_EMAIL` y `INIT_ADMIN_PASSWORD` para crear el primer admin en el primer deploy.
   - Las demás (Stripe, Google, Twilio, Mercado Pago, etc.) si las usas.

3. **Base de datos en la nube**
   - Crear un Postgres en Neon o Supabase.
   - **Las migraciones deben estar en el repo** (`backend/prisma/migrations/` versionado en git; no ignorar esa carpeta).

### Checklist: migrar producción sin tocar la base equivocada

El backend en Vercel usa la base definida por **`DATABASE_URL` / `DIRECT_URL` de Production**. Tu `.env` local puede apuntar a **otro** proyecto o región: si corrés `migrate deploy` sin cuidado, podés aplicar migraciones en la DB equivocada y que producción siga fallando (columnas inexistentes).

1. **Confirmar el proyecto correcto**  
   Compará el **hostname** de `DATABASE_URL` en Vercel (Production) con el de Supabase → Database → *Connection string* (pooler). Deben coincidir (misma región, mismo proyecto), por ejemplo `aws-1-us-east-1.pooler.supabase.com` vs otro host.

2. **Antes de desplegar código que asume un schema nuevo**  
   Aplicá las migraciones en **esa** base primero (o en la misma ventana de mantenimiento: DB → luego deploy). Si el código nuevo llega a prod antes que la migración, Prisma puede fallar al leer columnas que aún no existen.

3. **Ejecutar migraciones desde tu máquina** (con credenciales de **Production** copiadas de Vercel):

   ```bash
   cd backend
   ```

   Usá un entorno **limpio** para que tu `backend/.env` local no pise las URLs de prod (`env -i` deja solo lo que pasás explícito):

   ```bash
   env -i PATH="$PATH" HOME="$HOME" \
     DATABASE_URL='postgresql://...' \
     DIRECT_URL='postgresql://...' \
     npx prisma migrate deploy
   ```

   Pegá las cadenas completas desde Vercel (o desde Supabase del **mismo** proyecto que Vercel).
   Opcional: comprobar estado antes/después (`cd backend` o desde la raíz del monorepo: `npm run db:status`):

   ```bash
   env -i PATH="$PATH" HOME="$HOME" \
     DATABASE_URL='postgresql://...' \
     DIRECT_URL='postgresql://...' \
     npm run db:status
   ```

   **No** pegues comandos de terminal en el SQL Editor de Supabase; ahí solo va SQL.

4. **No apliques SQL a mano en producción**  
   Todo cambio de esquema va como migración en `prisma/migrations/` y se aplica con `prisma migrate deploy`. Si se aplica SQL desde el SQL Editor, `_prisma_migrations` queda desalineada y después hay que marcar cada migración con `prisma migrate resolve --applied <nombre>`.

5. **Opcional tras el primer deploy**  
   `npm run db:seed` solo si corresponde (no en DB compartida sin acordar).

6. **URL del backend**
   - Tras el deploy, Vercel te da una URL (ej. `https://appointments-backend-xxx.vercel.app`).
   - En el **proyecto frontend** (turneiro) en Vercel → Environment Variables:
     - `NEXT_PUBLIC_API_URL` = esa URL (sin barra final).
   - Redeploy del frontend.

7. **Probar**
   - Abrir `https://tu-backend.vercel.app/health` o `https://tu-backend.vercel.app/api/health` → debe devolver `{"status":"ok",...}`.
