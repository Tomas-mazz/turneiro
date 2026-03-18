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
                <strong>Google:</strong> si iniciás sesión con Google, los datos que Google autorice
                (p. ej. email, nombre).
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
              Gestionar cuentas, login (OAuth), turnos y comunicaciones del servicio. Conservación
              mientras uses el servicio y según ley. Derechos: contacto arriba. Podés revocar acceso
              Google desde tu cuenta Google.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900">4. Compartición</h2>
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
