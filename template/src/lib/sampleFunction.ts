import { VoiceEntry, ProcessedResult, Task, VoicePerspective } from './types'

/**
 * Detects and splits conflicting perspectives in text
 * Looks for patterns like:
 * - "I know X, but Y"
 * - "I want X, but Y"
 * - "I should X, but Y"
 * - "I say X, but Y"
 */
function extractPerspectives(text: string, entryId: string, emotionScore: number | null): VoicePerspective[] {
  const perspectives: VoicePerspective[] = []
  
  // Patterns that indicate conflicting perspectives
  const conflictPatterns = [
    /(?:I know|I want|I should|I say|I think) ([^,]+), (?:but|though|yet|however) ([^.!?]+)/gi,
    /(?:I tell myself|I believe) ([^,]+), (?:but|though|yet|however) ([^.!?]+)/gi
  ]

  // Check for conflicts
  for (const pattern of conflictPatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const rationalPart = match[1].trim()
      const emotionalPart = match[2].trim()

      // Determine perspective types based on content
      const rationalKeywords = ['should', 'need', 'must', 'have to', 'know', 'think', 'believe']
      const emotionalKeywords = ['feel', 'want', 'wish', 'hope', 'afraid', 'scared', 'anxious', 'keep']

      const isRational = rationalKeywords.some(keyword => rationalPart.toLowerCase().includes(keyword))
      const isEmotional = emotionalKeywords.some(keyword => emotionalPart.toLowerCase().includes(keyword))

      // Add both perspectives
      perspectives.push({
        text: rationalPart,
        emotion_score: emotionScore !== null ? emotionScore * 0.7 : null, // Rational thoughts tend to have lower emotion
        perspective_type: isRational ? 'rational' : 'conflict',
        source_entry_id: entryId
      })

      perspectives.push({
        text: emotionalPart,
        emotion_score: emotionScore !== null ? emotionScore * 1.3 : null, // Emotional thoughts tend to have higher emotion
        perspective_type: isEmotional ? 'emotional' : 'conflict',
        source_entry_id: entryId
      })
    }
  }

  // If no conflicts found, add the entire text as a single perspective
  if (perspectives.length === 0) {
    perspectives.push({
      text,
      emotion_score: emotionScore,
      perspective_type: 'conflict', // Default type when we can't determine
      source_entry_id: entryId
    })
  }

  return perspectives
}

/**
 * Extracts tasks from a text entry
 * Looks for patterns like:
 * - "I need to..." / "I have to..." / "I should..."
 * - "Need to..." / "Have to..." / "Should..."
 * - "Tomorrow I'm going to..."
 * - "I plan to..."
 * - "I'm going to..."
 */
function extractTasks(text: string, entryId: string): Task[] {
  const tasks: Task[] = []
  
  // First, split the text into individual tasks
  const taskParts = text.split(/(?: and |, )/i)
  
  for (const part of taskParts) {
    const taskPatterns = [
      /(?:I need to|I have to|I should|Need to|Have to|Should|Tomorrow I'm going to|I plan to|I'm going to) ([^.!?]+)/i,
      /(?:Gotta|Need to|Have to) ([^.!?]+)/i
    ]

    for (const pattern of taskPatterns) {
      const match = part.trim().match(pattern)
      if (match) {
        const taskText = match[1].trim()
        
        // Extract due date if present
        let dueDate = null
        const datePatterns = [
          /(?:by|before|on) (?:next |this )?(?:week|month|year|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i,
          /(?:in|after) (\d+) (?:days|weeks|months|years)/i,
          /(?:by|before) (\d{1,2}\/\d{1,2}\/\d{4})/i
        ]

        for (const datePattern of datePatterns) {
          const dateMatch = taskText.match(datePattern)
          if (dateMatch) {
            dueDate = dateMatch[0]
            break
          }
        }

        // Determine category based on keywords
        let category = null
        const categoryKeywords = {
          work: ['work', 'office', 'meeting', 'project', 'deadline'],
          personal: ['home', 'family', 'friend', 'personal', 'health'],
          errands: ['buy', 'shop', 'grocery', 'store', 'appointment'],
          learning: ['learn', 'study', 'read', 'course', 'class']
        }

        for (const [cat, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(keyword => taskText.toLowerCase().includes(keyword))) {
            category = cat
            break
          }
        }

        tasks.push({
          task_text: taskText,
          due_date: dueDate,
          status: 'pending',
          category,
          source_entry_id: entryId
        })
        break // Only add one task per part
      }
    }
  }

  return tasks
}

/**
 * processEntries
 * --------------
 * Analyzes voice entries to provide insights about emotions, patterns, and common themes.
 * Extracts structured tasks and detects conflicting perspectives.
 * PURE function — no IO, no mutation, deterministic.
 */
export function processEntries(entries: VoiceEntry[]): ProcessedResult {
  // Count tag frequencies
  const tagFrequencies: Record<string, number> = {}
  for (const e of entries) {
    // Count user tags
    for (const tag of e.tags_user) {
      tagFrequencies[tag] = (tagFrequencies[tag] || 0) + 1
    }
    // Count model tags
    for (const tag of e.tags_model) {
      tagFrequencies[tag] = (tagFrequencies[tag] || 0) + 1
    }
  }

  // Calculate average emotion score
  const totalEmotionScore = entries.reduce((sum, entry) => 
    sum + (entry.emotion_score_score || 0), 0)
  const avgEmotionScore = entries.length > 0 ? totalEmotionScore / entries.length : 0

  // Extract tasks and perspectives from entries
  const tasks: Task[] = []
  const perspectives: VoicePerspective[] = []
  for (const entry of entries) {
    const extractedTasks = extractTasks(entry.transcript_user, entry.id)
    tasks.push(...extractedTasks)

    const extractedPerspectives = extractPerspectives(entry.transcript_user, entry.id, entry.emotion_score_score)
    perspectives.push(...extractedPerspectives)
  }

  // Generate summary
  const summary = `Analyzed ${entries.length} entries with an average emotion score of ${avgEmotionScore.toFixed(2)}. ` +
    `Found ${Object.keys(tagFrequencies).length} unique tags, extracted ${tasks.length} tasks, ` +
    `and identified ${perspectives.length} distinct perspectives.`

  return {
    summary,
    tagFrequencies,
    tasks,
    perspectives
  }
}

export default processEntries 