// eslint-disable-next-line import/no-extraneous-dependencies
// @ts-ignore vitest types are provided via tsconfig "types"
import { describe, it, expect } from 'vitest'
import { mockVoiceEntries } from '../src/lib/mockData.js'
import processEntries from '../src/lib/sampleFunction.js'

describe('processEntries', () => {
  it('should process an empty array', () => {
    const result = processEntries([])
    expect(result.summary).toBe('Analyzed 0 entries with an average emotion score of 0.00. Found 0 unique tags, extracted 0 tasks, and identified 0 distinct perspectives.')
    expect(result.tagFrequencies).toEqual({})
    expect(result.tasks).toEqual([])
    expect(result.perspectives).toEqual([])
  })

  it('should extract tasks with due dates', () => {
    const entries = [{
      id: '1',
      user_id: 'user1',
      audio_url: null,
      transcript_raw: 'I need to finish the report by next week',
      transcript_user: 'I need to finish the report by next week',
      language_detected: 'en',
      language_rendered: 'en',
      tags_model: [],
      tags_user: [],
      category: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      emotion_score_score: 0.5,
      embedding: null
    }]

    const result = processEntries(entries)
    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0]).toEqual({
      task_text: 'finish the report by next week',
      due_date: 'by next week',
      status: 'pending',
      category: null,
      source_entry_id: '1'
    })
  })

  it('should categorize tasks based on keywords', () => {
    const entries = [{
      id: '1',
      user_id: 'user1',
      audio_url: null,
      transcript_raw: 'I need to buy groceries and finish the work report',
      transcript_user: 'I need to buy groceries and finish the work report',
      language_detected: 'en',
      language_rendered: 'en',
      tags_model: [],
      tags_user: [],
      category: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      emotion_score_score: 0.5,
      embedding: null
    }]

    const result = processEntries(entries)
    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0].category).toBe('errands')
  })

  it('should handle multiple tasks in one entry', () => {
    const entries = [{
      id: '1',
      user_id: 'user1',
      audio_url: null,
      transcript_raw: 'I need to buy groceries and I have to finish the work report',
      transcript_user: 'I need to buy groceries and I have to finish the work report',
      language_detected: 'en',
      language_rendered: 'en',
      tags_model: [],
      tags_user: [],
      category: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      emotion_score_score: 0.5,
      embedding: null
    }]

    const result = processEntries(entries)
    expect(result.tasks).toHaveLength(2)
    expect(result.tasks[0].task_text).toBe('buy groceries')
    expect(result.tasks[1].task_text).toBe('finish the work report')
  })

  it('should detect and split conflicting perspectives', () => {
    const entries = [{
      id: '1',
      user_id: 'user1',
      audio_url: null,
      transcript_raw: 'I know I should sleep, but I keep scrolling',
      transcript_user: 'I know I should sleep, but I keep scrolling',
      language_detected: 'en',
      language_rendered: 'en',
      tags_model: [],
      tags_user: [],
      category: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      emotion_score_score: 0.5,
      embedding: null
    }]

    const result = processEntries(entries)
    expect(result.perspectives).toHaveLength(2)
    expect(result.perspectives[0]).toEqual({
      text: 'I should sleep',
      emotion_score: 0.35, // 0.5 * 0.7 for rational thought
      perspective_type: 'rational',
      source_entry_id: '1'
    })
    expect(result.perspectives[1]).toEqual({
      text: 'I keep scrolling',
      emotion_score: 0.65, // 0.5 * 1.3 for emotional thought
      perspective_type: 'emotional',
      source_entry_id: '1'
    })
  })

  it('should handle entries with no conflicts', () => {
    const entries = [{
      id: '1',
      user_id: 'user1',
      audio_url: null,
      transcript_raw: 'I had a great day today',
      transcript_user: 'I had a great day today',
      language_detected: 'en',
      language_rendered: 'en',
      tags_model: [],
      tags_user: [],
      category: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      emotion_score_score: 0.8,
      embedding: null
    }]

    const result = processEntries(entries)
    expect(result.perspectives).toHaveLength(1)
    expect(result.perspectives[0]).toEqual({
      text: 'I had a great day today',
      emotion_score: 0.8,
      perspective_type: 'conflict',
      source_entry_id: '1'
    })
  })

  it('should process mock data', () => {
    const result = processEntries(mockVoiceEntries)
    expect(result.summary).toContain('Analyzed')
    expect(result.summary).toContain('unique tags')
    expect(result.summary).toContain('tasks')
    expect(result.summary).toContain('perspectives')
    expect(result.tagFrequencies).toBeDefined()
    expect(result.tasks).toBeDefined()
    expect(result.perspectives).toBeDefined()
  })
}) 