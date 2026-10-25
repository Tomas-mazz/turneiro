import { defineConfig } from 'vitest/config'

// Production runs on Vercel in UTC. Force the same timezone so date handling bugs
// show up locally instead of being hidden by the developer machine's timezone.
process.env.TZ = 'UTC'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
