import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidad | Turneiro",
  description: "Política de privacidad de Turneiro — plataforma de reservas y turnos online.",
};

const CONTACT_EMAIL = "turneiro.info@gmail.com";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12 text-gray-800 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-sm text-gray-500">
          <Link href="/" className="text-gray-700 underline hover:text-gray-900">
            ← Volver al inicio
          </Link>
        </p>
        <h1 className="font-heading mt-6 text-3xl font-bold text-gray-900">
          Política de privacidad
        </h1>
        <p className="mt-2 text-sm text-gray-500">Última actualización: 2026-03-18</p>

        <div className="prose prose-gray mt-8 max-w-none space-y-6 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900">1. Responsable</h2>
            <p className="mt-2">
              El servicio <strong>Turneiro</strong> (sitio principal <strong>turneiro.com</strong> y
              subdominios asociados) facilita la gestión y reserva de turnos. Consultas:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-gray-900 underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900">
              2. Datos que recopilamos
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Cuenta:</strong> nombre, email, contraseña (segura), perfil y datos del
                negocio.
              </li>
              <li>
                <strong>Google (inicio de sesión):</strong> si iniciás sesión con Google, los datos
                básicos del perfil que Google autorice (p. ej. email, nombre).
              </li>
              <li>
                <strong>Google Calendar (opcional):</strong> si conectás tu calendario, guardamos un{" "}
                <strong>token de actualización</strong> (refresh token) para mantener la conexión y
                sincronizar turnos. También podemos almacenar identificadores técnicos como{" "}
                <strong>calendarId</strong> y el <strong>eventId</strong> del evento creado para un
                turno.
              </li>
              <li>
                <strong>Reservas:</strong> turnos, servicios, horarios y datos necesarios para
                operarlos.
              </li>
              <li>
                <strong>Técnicos:</strong> IP, navegador, sesión/cookies para seguridad.
              </li>
            </ul>
          </section>
          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900">
              3. Finalidad y conservación
            </h2>
            <p className="mt-2">
              Usamos los datos para gestionar cuentas, login (OAuth), turnos y comunicaciones del
              servicio. Si conectás Google Calendar, usamos los permisos solicitados solo para{" "}
              <strong>listar calendarios</strong> y <strong>crear/actualizar/eliminar</strong>{" "}
              eventos asociados a turnos.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Retención general:</strong> conservamos la información de la cuenta y los
                datos operativos mientras tu cuenta esté activa y por el tiempo necesario para
                cumplir obligaciones legales o resolver disputas.
              </li>
              <li>
                <strong>Google Calendar:</strong> el refresh token se conserva mientras mantengas la
                conexión activa. Al desconectar, eliminamos el token y dejamos de acceder a tu
                cuenta de Google a través de nuestra app.
              </li>
            </ul>
          </section>
          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900">
              4. Seguridad y protección de datos
            </h2>
            <p className="mt-2">
              Aplicamos medidas razonables para proteger la información que procesamos, incluyendo:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Transmisión segura:</strong> cifrado en tránsito mediante HTTPS/TLS.
              </li>
              <li>
                <strong>Contraseñas:</strong> se almacenan usando hashing seguro (no guardamos tu
                contraseña en texto plano).
              </li>
              <li>
                <strong>Acceso restringido:</strong> controles de acceso y principio de mínimo
                privilegio para el personal y sistemas que operan el servicio.
              </li>
              <li>
                <strong>Infraestructura:</strong> usamos proveedores de infraestructura bajo
                acuerdos de confidencialidad y buenas prácticas de seguridad.
              </li>
            </ul>
          </section>
          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900">
              5. Eliminación de datos y revocación de acceso Google
            </h2>
            <p className="mt-2">
              Podés desconectar Google Calendar desde la configuración de tu cuenta en Turneiro. Al
              hacerlo, eliminamos el refresh token almacenado y dejamos de sincronizar eventos.
              También podés revocar el acceso desde tu Cuenta de Google en la sección de acceso de
              terceros.
            </p>
            <p className="mt-2">
              Si querés solicitar la eliminación de tu cuenta y/o datos, escribinos a{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-gray-900 underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900">6. Compartición</h2>
            <p className="mt-2">
              Datos de reserva visibles para el negocio y quien reserva. Proveedores de
              infraestructura bajo confidencialidad. No vendemos datos para marketing de terceros.
            </p>
          </section>
          <p className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Nota:</strong> plantilla orientativa; no sustituye asesoría legal.
          </p>
        </div>
        <p className="mt-8 text-center text-sm text-gray-500">
          <Link href="/terms" className="underline hover:text-gray-800">
            Términos de servicio
          </Link>
        </p>
      </article>
    </main>
  );
}
