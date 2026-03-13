# Turneiro — URLs legales y Google Cloud

Rama: **`feature/legal-privacy-terms`** (desde `main`).

## URLs en producción (`turneiro.com`)

| Uso | URL |
|-----|-----|
| Home (Google Branding) | `https://turneiro.com` |
| Política de privacidad | `https://turneiro.com/privacy` |
| Términos de servicio | `https://turneiro.com/terms` |

## Google Cloud (Branding / OAuth)

1. **Application home page:** `https://turneiro.com`
2. **Privacy policy:** `https://turneiro.com/privacy`
3. **Terms of service:** `https://turneiro.com/terms`
4. **Authorised domain:** `turneiro.com` (verificar en Search Console si Google lo pide)

## Deploy

Hacé merge de `feature/legal-privacy-terms` a la rama que deployás (o deployá esa rama) para que las rutas existan en producción antes de validar enlaces en Google.

## Contacto en las páginas

Por defecto: `contacto@turneiro.com`. Cambiá `CONTACT_EMAIL` en:

- `frontend/app/privacy/page.tsx`
- `frontend/app/terms/page.tsx`
