import { useEffect, useState } from 'react'

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard'])

function normalizeQuestion(question, index) {
  if (
    !question ||
    typeof question.question !== 'string' ||
    !Array.isArray(question.options) ||
    question.options.length !== 4
  ) {
    return null
  }

  const correctIndex = Number(question.correctIndex)
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    return null
  }

  const difficulty = VALID_DIFFICULTIES.has(question.difficulty)
    ? question.difficulty
    : 'medium'

  return {
    id: `${difficulty}-${index}-${question.question}`,
    question: question.question.trim(),
    options: question.options.map((option) => String(option)),
    correctIndex,
    answer: String(question.options[correctIndex]),
    difficulty,
    points:
      difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20,
  }
}

export function useQuestionGenerator(topic) {
  const [questions, setQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!topic) {
      setQuestions([])
      setIsLoading(false)
      setError('')
      return
    }

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) {
      setQuestions([])
      setIsLoading(false)
      setError('Missing Anthropic API key.')
      return
    }

    let cancelled = false

    async function generateQuestions() {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 2500,
            system:
              'You are a quiz question generator. Return ONLY a valid JSON array. No markdown, no backticks, no explanation. Just the raw JSON array.',
            messages: [
              {
                role: 'user',
                content: `Generate 20 quiz questions about ${topic}. Return a JSON array where each object has: { question, options: [A,B,C,D], correctIndex, difficulty, points } difficulty is easy/medium/hard. points: easy=10, medium=15, hard=20. Mix: 7 easy, 7 medium, 6 hard. Make questions fun and challenging.`,
              },
            ],
          }),
        })

        if (!response.ok) {
          throw new Error(`Anthropic request failed with status ${response.status}`)
        }

        const data = await response.json()
        const content = data?.content?.[0]?.text ?? '[]'
        const parsed = JSON.parse(content)

        if (!Array.isArray(parsed)) {
          throw new Error('Anthropic returned invalid question data.')
        }

        const normalized = parsed
          .map(normalizeQuestion)
          .filter(Boolean)

        if (!cancelled) {
          setQuestions(normalized)
        }
      } catch (caughtError) {
        if (!cancelled) {
          setQuestions([])
          setError(caughtError.message || 'Failed to generate questions.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    generateQuestions()

    return () => {
      cancelled = true
    }
  }, [topic])

  return { questions, isLoading, error }
}
