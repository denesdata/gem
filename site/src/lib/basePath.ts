export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

export function publicUrl(path: string): string {
  const normalised = path.startsWith('/') ? path : `/${path}`
  return `${BASE_PATH}${normalised}`
}
