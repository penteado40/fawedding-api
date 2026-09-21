import { describe, expect, it } from 'vitest'
import { hashToken, verifyToken } from './token-hash'

describe('token-hash', () => {
  it('round-trips: verify succeeds against the hash of the same token', () => {
    const token = 'a-real-token-value'
    expect(verifyToken(token, hashToken(token))).toBe(true)
  })

  it('fails verification for a wrong token', () => {
    const hash = hashToken('the-real-token')
    expect(verifyToken('a-different-token', hash)).toBe(false)
  })

  it('never verifies true for empty/undefined input against empty/undefined stored hash', () => {
    expect(verifyToken(undefined, undefined)).toBe(false)
    expect(verifyToken('', '')).toBe(false)
    expect(verifyToken(undefined, hashToken(''))).toBe(false)
    expect(verifyToken('', hashToken(''))).toBe(false)
  })
})
