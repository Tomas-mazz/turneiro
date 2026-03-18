import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos del servicio | Turneiro",
  description: "Términos y condiciones de uso de Turneiro.",
};

const CONTACT_EMAIL = "turneiro.info@gmail.com";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12 text-gray-800 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-sm text-gray-500">
          <Link href="/" className="text-gray-700 underline hover:text-gray-900">
            ← Volver al inicio
          </Link>
        </p>
        <h1 className="font-heading mt-6 text-3xl font-bold text-gray-900">
          Términos del servicio
        </h1>
        <p className="mt-2 text-sm text-gray-500">Última actualización: 2026-03-18</p>

        <div className="prose prose-gray mt-8 max-w-none space-y-6 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900">1. Aceptación</h2>
            <p className="mt-2">
              Al usar <strong>Turneiro</strong> en <strong>turneiro.com</strong> y subdominios
              aceptás estos términos.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900">2. Cuenta y uso</h2>
            <p className="mt-2">
              Debés brindar información veraz y sos responsable de tu cuenta y del inicio de sesión
              con Google. No podés usar la plataforma para actividades ilegales o abusivas.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900">3. Turnos</h2>
            <p className="mt-2">
              Turneiro es una herramienta tecnológica; la relación entre negocio y cliente es entre
              ellos.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-semibold text-gray-900">4. Servicio</h2>
            <p className="mt-2">
              El servicio se brinda según disponibilidad y puede modificarse. Si tenés dudas o
              consultas, contactanos a{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
          <p className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Nota:</strong> plantilla general; revisá con un abogado.
          </p>
        </div>
        <p className="mt-8 text-center text-sm text-gray-500">
          <Link href="/privacy" className="underline hover:text-gray-800">
            Política de privacidad
          </Link>
        </p>
      </article>
    </main>
  );
}
