import app from './app'
import { ensureFirstAdmin } from './ensureFirstAdmin'

const PORT = process.env.PORT || 3001

async function start() {
  await ensureFirstAdmin()
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('Startup failed:', err)
  process.exit(1)
})
