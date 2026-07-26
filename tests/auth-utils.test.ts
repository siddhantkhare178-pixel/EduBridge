import { describe, expect, it } from 'vitest'
import { normalizeEmail } from '../lib/auth-utils'

describe('normalizeEmail', () => {
  it('lowercases and trims email addresses for consistent auth lookups', () => {
    expect(normalizeEmail(' User@Example.COM ')).toBe('user@example.com')
  })

  it('returns empty string for blank input', () => {
    expect(normalizeEmail('   ')).toBe('')
  })
})
