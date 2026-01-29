# AI Rules for Cursor

## Project Language Rules

**IMPORTANT** – Two separate rules:

1. **In English only** (code, repo, tooling):
   - Code comments
   - Git commits and commit messages
   - README and technical documentation
   - Variable names and function names
   - API documentation
   - Database schema and field names
   - Environment variable names
   - Configuration files

2. **User-facing content: Spanish by default**
   - All text that the end user sees (UI labels, buttons, messages, errors shown in the app) must be in **Spanish**.
   - Optional: add i18n later to support English as a second language; until then, Spanish is the only UI language.

## Code Organization Principles

1. **Feature-Based Components**: Group components by feature, not by type
2. **Colocation**: Keep related files together
3. **Barrel Exports**: Use index.ts for clean imports
4. **Type Safety**: Define types in dedicated files
5. **Utility Functions**: Keep reusable logic in lib/
6. **Server vs Client**: Clearly separate server and client components

## Security Requirements

1. **Environment Variables**: Never commit secrets to Git
2. **Input Validation**: Validate all user inputs with Zod
3. **SQL Injection**: Use Prisma parameterized queries (automatic)
4. **XSS Protection**: Sanitize user-generated content
5. **CSRF Protection**: NextAuth.js handles this automatically
6. **Rate Limiting**: Implement rate limiting on API routes
7. **HTTPS**: Always use HTTPS in production
8. **Password Hashing**: Use bcrypt for password hashing
9. **Token Security**: Use cryptographically secure tokens for cancellation links
10. **Webhook Verification**: Always verify webhook signatures

## Performance Requirements

1. **Database Indexing**: Add indexes on frequently queried fields
2. **Caching**: Use Next.js caching for static data
3. **Image Optimization**: Use Next.js Image component
4. **Code Splitting**: Leverage Next.js automatic code splitting
5. **Database Queries**: Use Prisma includes to avoid N+1 queries
6. **CDN**: Vercel provides automatic CDN for static assets
7. **Pagination**: Implement pagination for large data sets
8. **Lazy Loading**: Load components and data on demand

## Validation Requirements

- Phone number validation: accepts both international (+1234567890) and local formats
- Service duration: 15-120 minutes
- All user inputs must be validated with Zod schemas
- Real-time validation for forms
- Error messages must be clear and actionable

## Internationalization Requirements

- **Default UI language: Spanish.** All user-facing text in the app is in Spanish.
- Optional later: add i18n and language switcher (e.g. English); persist preference in localStorage.
- Code, comments, README, and commits remain in English.

## Timezone Requirements

- Global timezone for all businesses (single timezone configuration)
- Use APP_TIMEZONE environment variable
- Convert dates appropriately using date-fns-tz
- Store dates in UTC, display in configured timezone
