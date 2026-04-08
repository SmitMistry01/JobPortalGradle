import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../app/store'

const DEFAULT_API_BASE_URL = 'https://nexusapi.duckdns.org/api'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const API_BASE_URL = configuredApiBaseUrl && configuredApiBaseUrl.length > 0
  ? configuredApiBaseUrl
  : DEFAULT_API_BASE_URL
const REQUEST_TIMEOUT_MS = 15000

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

      if (isLikelyJwt(token)) {
        headers.set('Authorization', `Bearer ${token}`)
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
          const headerMap = config.headers as Record<string, string>
          delete headerMap['Content-Type']
          delete headerMap['content-type']
        }
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

      // Preserve RTK Query cancellation behavior while adding a hard timeout.
      if (config?.signal) {
        config.signal.addEventListener('abort', () => controller.abort(), { once: true })
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

