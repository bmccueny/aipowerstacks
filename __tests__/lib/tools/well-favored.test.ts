import { describe, it, expect } from 'vitest'
import { isWellFavoredTool } from '@/lib/tools/well-favored'

describe('isWellFavoredTool', () => {
  describe('slug matching', () => {
    it('returns true for a well-favored slug', () => {
      expect(isWellFavoredTool({ slug: 'claude-code' })).toBe(true)
      expect(isWellFavoredTool({ slug: 'gemini' })).toBe(true)
      expect(isWellFavoredTool({ slug: 'speechify' })).toBe(true)
      expect(isWellFavoredTool({ slug: 'lovo-ai' })).toBe(true)
    })

    it('is case-insensitive for slugs', () => {
      expect(isWellFavoredTool({ slug: 'CLAUDE-CODE' })).toBe(true)
      expect(isWellFavoredTool({ slug: 'Gemini' })).toBe(true)
    })

    it('trims whitespace from slugs', () => {
      expect(isWellFavoredTool({ slug: '  gemini  ' })).toBe(true)
    })
  })

  describe('name matching', () => {
    it('returns true for a well-favored name', () => {
      expect(isWellFavoredTool({ name: 'Claude Code' })).toBe(true)
      expect(isWellFavoredTool({ name: 'Gemini' })).toBe(true)
      expect(isWellFavoredTool({ name: 'Speechify' })).toBe(true)
      expect(isWellFavoredTool({ name: 'Lovo AI' })).toBe(true)
    })

    it('normalizes extra whitespace in names', () => {
      expect(isWellFavoredTool({ name: 'Claude  Code' })).toBe(true)
    })

    it('normalizes special characters in names', () => {
      expect(isWellFavoredTool({ name: 'Claude-Code' })).toBe(true)
    })
  })

  describe('negative cases', () => {
    it('returns false for an unknown tool', () => {
      expect(isWellFavoredTool({ slug: 'some-random-tool', name: 'Some Tool' })).toBe(false)
    })

    it('returns false for an empty object', () => {
      expect(isWellFavoredTool({})).toBe(false)
    })

    it('returns false for null slug and null name', () => {
      expect(isWellFavoredTool({ slug: null, name: null })).toBe(false)
    })

    it('returns false for a partial name match', () => {
      expect(isWellFavoredTool({ name: 'Claude' })).toBe(false)
    })
  })
})
