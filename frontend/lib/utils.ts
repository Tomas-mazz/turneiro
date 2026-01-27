// General utility functions
// TODO: Add utility functions as needed

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
