import { baseApi } from '../../services/baseApi'

export interface ChatRequest {
  message: string
}

export interface ChatResponse {
  reply: string
}

export const aiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    chat: builder.mutation<ChatResponse, ChatRequest>({
      query: (body) => ({
        url: '/ai/chat',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const { useChatMutation } = aiApi
