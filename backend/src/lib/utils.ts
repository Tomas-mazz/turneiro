// General utility functions
// TODO: Add utility functions as needed

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'An unknown error occurred'
}
