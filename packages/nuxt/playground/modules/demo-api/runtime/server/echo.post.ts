import { readBody, type H3Event } from 'h3'

export interface CallaMeta {
  body: {
    message: string
    repeat?: number
  }
  res: {
    echoed: string[]
    total: number
  }
}

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody<CallaMeta['body']>(event)
  const repeat = Math.max(1, Math.min(3, body?.repeat ?? 1))
  const message = body?.message ?? ''

  return {
    echoed: Array.from({ length: repeat }, () => message),
    total: repeat,
  } satisfies CallaMeta['res']
})
