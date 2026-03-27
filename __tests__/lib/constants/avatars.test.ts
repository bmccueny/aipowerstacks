import { describe, it, expect } from 'vitest'
import { getRandomPixelAvatar, PIXEL_AVATARS } from '@/lib/constants/avatars'

describe('PIXEL_AVATARS', () => {
  it('contains at least one avatar URL', () => {
    expect(PIXEL_AVATARS.length).toBeGreaterThan(0)
  })

  it('all entries are dicebear URLs', () => {
    PIXEL_AVATARS.forEach((url) => {
      expect(url).toContain('dicebear.com')
    })
  })
})

describe('getRandomPixelAvatar', () => {
  it('returns a value from PIXEL_AVATARS', () => {
    const avatar = getRandomPixelAvatar()
    expect(PIXEL_AVATARS).toContain(avatar)
  })

  it('returns a string', () => {
    expect(typeof getRandomPixelAvatar()).toBe('string')
  })

  it('can return different values across calls', () => {
    // Run enough times that the chances of always getting the same value are negligible
    const results = new Set(Array.from({ length: 50 }, () => getRandomPixelAvatar()))
    expect(results.size).toBeGreaterThan(1)
  })
})
