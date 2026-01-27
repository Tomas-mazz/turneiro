# AI Rules for Cursor

## Project Language Rules

**IMPORTANT**: All project content must be in English:
- Code comments
- Git commits and commit messages
- README files and documentation
- Variable names and function names
- User-facing text (with i18n support for English/Spanish in the UI)
- API documentation
- Error messages and logs
- Database schema and field names
- Environment variable names
- Configuration files

The user interface will support English and Spanish through internationalization (i18n), but all code, documentation, and technical content must be in English.

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

- Support English and Spanish in MVP
- Language switcher button on booking page
- Persist language preference in localStorage
- All user-facing text must be translatable
- Code and documentation remain in English

## Timezone Requirements

- Global timezone for all businesses (single timezone configuration)
- Use APP_TIMEZONE environment variable
- Convert dates appropriately using date-fns-tz
- Store dates in UTC, display in configured timezone
