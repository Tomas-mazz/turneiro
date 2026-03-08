# Desplegar el backend en Vercel

El backend está preparado para correr como serverless en Vercel.

## Pasos manuales (después de push)

1. **Nuevo proyecto en Vercel**
   - Vercel → Add New → Project → mismo repo de GitHub.
   - **Root Directory:** `backend` (importante).
   - Deploy.

2. **Variables de entorno (proyecto backend en Vercel)**
   - Settings → Environment Variables. Añadir al menos:
     - `DATABASE_URL` — connection string de PostgreSQL en la nube (Neon, Supabase, etc.).
     - `FRONTEND_URL` — `https://www.turneiro.com` (o la URL de tu frontend).
     - `JWT_SECRET` — mismo que en local.
   - Opcional: `INIT_ADMIN_EMAIL` y `INIT_ADMIN_PASSWORD` para crear el primer admin en el primer deploy.
   - Las demás (Stripe, Google, Twilio, etc.) si las usas.

3. **Base de datos en la nube**
   - Crear un Postgres en Neon o Supabase.
   - Ejecutar migraciones una vez: desde tu máquina con `DATABASE_URL` de producción:
     - `npx prisma migrate deploy`
     - Opcional: `npm run db:seed`

4. **URL del backend**
   - Tras el deploy, Vercel te da una URL (ej. `https://appointments-backend-xxx.vercel.app`).
   - En el **proyecto frontend** (turneiro) en Vercel → Environment Variables:
     - `NEXT_PUBLIC_API_URL` = esa URL (sin barra final).
   - Redeploy del frontend.

5. **Probar**
   - Abrir `https://tu-backend.vercel.app/health` o `https://tu-backend.vercel.app/api/health` → debe devolver `{"status":"ok",...}`.
