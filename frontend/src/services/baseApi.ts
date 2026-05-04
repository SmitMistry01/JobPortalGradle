import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../app/store'

const DEFAULT_API_BASE_URL = 'https://nexusapi.duckdns.org/api'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const API_BASE_URL = configuredApiBaseUrl && configuredApiBaseUrl.length > 0
  ? configuredApiBaseUrl
  : DEFAULT_API_BASE_URL
// Allow overriding the request timeout via Vite env var VITE_API_TIMEOUT_MS (milliseconds).
const configuredTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? '')
const REQUEST_TIMEOUT_MS = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 15000

function isLikelyJwt(value: unknown): value is string {
  return typeof value === 'string' && value.split('.').length === 3
}

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState
      const token = state.auth.token ?? localStorage.getItem('jp_token') ?? localStorage.getItem('token')
      const userId = state.auth.user?.userId

      if (isLikelyJwt(token)) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      if (typeof userId === 'number' && Number.isFinite(userId)) {
        headers.set('X-User-Id', String(userId))
      }
      return headers
    },
    // For multipart requests, let the browser generate Content-Type with boundary.
    fetchFn: async (...args) => {
      const [resource, config] = args

      if (config?.body instanceof FormData && config.headers) {
        if (config.headers instanceof Headers) {
          config.headers.delete('content-type')
          config.headers.delete('Content-Type')
        } else if (Array.isArray(config.headers)) {
          config.headers = config.headers.filter(([key]) => key.toLowerCase() !== 'content-type')
        } else {
          const headerMap: any = config.headers
          delete headerMap['Content-Type']
          delete headerMap['content-type']
        }
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        // Helpful runtime log to distinguish client hard timeout from other aborts.
        try {
          // resource may be a Request object or string URL
          // eslint-disable-next-line no-console
          console.warn('baseApi: request timed out after', REQUEST_TIMEOUT_MS, 'ms', resource)
        } catch {}
        controller.abort()
      }, REQUEST_TIMEOUT_MS)

      //Preserve RTK Query cancellation behavior while adding a hard timeout.
      if (config?.signal) {
        // If RTK Query or caller cancels the request, propagate and log for debugging.
        try {
          config.signal.addEventListener('abort', () => {
            // eslint-disable-next-line no-console
            console.debug('baseApi: upstream signal aborted request for', resource)
            controller.abort()
          }, { once: true })
        } catch {}
      }

      try {
        return await fetch(resource as Request | string, {
          ...config,
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeoutId)
      }
    },
  }),
  tagTypes: ['Auth'],
  endpoints: () => ({}),
})
