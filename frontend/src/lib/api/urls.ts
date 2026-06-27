const normalizeBaseUrl = (value: string | undefined) =>
  (value ?? '')
    .trim()
    .replace(/^['"]|['"];?$/g, '')
    .replace(/;+$/g, '')
    .replace(/\/+$/g, '')

export const backendBaseUrl = normalizeBaseUrl(import.meta.env.BE_URL)

export const apiBaseUrl = `${backendBaseUrl}/api/v1`

export function getAssetUrl(path?: string) {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return `${backendBaseUrl}/${path.replace(/^\/+/, '')}`
}
