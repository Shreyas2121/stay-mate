import { describe, expect, it } from 'vitest'
import { forgotPasswordSchema, resetPasswordSchema } from './auth.schema'

describe('auth reset schemas', () => {
  it('accepts valid forgot-password email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true)
  })

  it('rejects short reset passwords', () => {
    expect(resetPasswordSchema.safeParse({ password: '123' }).success).toBe(false)
  })
})
