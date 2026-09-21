import { describe, expect, it } from 'vitest'
import { assertAllowedImageUrl } from './image-url'

const OK = 'https://images.unsplash.com/photo-1?auto=format&w=500'

describe('assertAllowedImageUrl', () => {
  it('accepts an https url on an allowed host and returns it', () => {
    expect(assertAllowedImageUrl(OK)).toBe(OK)
  })

  it('rejects a string that is not a url', () => {
    expect(() => assertAllowedImageUrl('not a url')).toThrow('valid URL')
  })

  it('rejects http', () => {
    expect(() => assertAllowedImageUrl('http://images.unsplash.com/photo-1')).toThrow('https')
  })

  it('rejects hosts outside the allowlist', () => {
    expect(() => assertAllowedImageUrl('https://example.com/a.jpg')).toThrow('host must be one of')
  })

  it('rejects lookalike hosts', () => {
    expect(() => assertAllowedImageUrl('https://images.unsplash.com.evil.com/a.jpg')).toThrow('host must be one of')
    expect(() => assertAllowedImageUrl('https://evilimages.unsplash.com/a.jpg')).toThrow('host must be one of')
  })

  it('rejects credentials in the url, even when the host is allowed', () => {
    expect(() => assertAllowedImageUrl('https://evil.com@images.unsplash.com/a.jpg')).toThrow('credentials')
  })

  it('rejects a custom port', () => {
    expect(() => assertAllowedImageUrl('https://images.unsplash.com:8443/a.jpg')).toThrow('custom port')
  })

  it('matches the host case-insensitively', () => {
    expect(() => assertAllowedImageUrl('https://IMAGES.Unsplash.com/a.jpg')).not.toThrow()
  })
})
