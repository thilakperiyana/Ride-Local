const configuredHost = (import.meta.env.HOST || '').trim().replace(/\/+$/, '')

export const API = configuredHost
  ? (configuredHost.endsWith('/api') ? configuredHost : `${configuredHost}/api`)
  : ''
