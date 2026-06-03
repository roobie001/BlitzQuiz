import { useEffect, useRef, useState } from "react";

const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeQuestion(question, index) {
  if (
    !question ||
    typeof question.question !== "string" ||
    !Array.isArray(question.options) ||
    question.options.length !== 4
  )
    return null;

  const correctIndex = Number(question.correctIndex);
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3)
    return null;

  const difficulty = VALID_DIFFICULTIES.has(question.difficulty)
    ? question.difficulty
    : "medium";

  // Track correct answer by VALUE not index before shuffling
  const correctAnswer = String(question.options[correctIndex]);

  // Shuffle options randomly
  const shuffledOptions = shuffleArray(question.options.map((o) => String(o)));

  // Find new position of correct answer after shuffle
  const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);

  return {
    id: `${difficulty}-${index}-${question.question}`,
    question: question.question.trim(),
    options: shuffledOptions,
    correctIndex: newCorrectIndex,
    answer: correctAnswer,
    difficulty,
    points: difficulty === "easy" ? 10 : difficulty === "medium" ? 15 : 20,
  };
}

const FIVE_MINUTES = 5 * 60 * 1000;

export function useQuestionGenerator(topic) {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const isFetchingRef = useRef(false);
  const cacheRef = useRef({});
  const topicRef = useRef(null);

  useEffect(() => {
    if (!topic) {
      topicRef.current = null;
      setQuestions([]);
      setIsLoading(false);
      setError("");
      return;
    }

    if (topic === topicRef.current) return;
    topicRef.current = topic;

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
      setError("Missing Groq API key.");
      return;
    }

    // Check cache with expiry — if within 5 minutes reuse, otherwise refetch
    const cached = cacheRef.current[topic];
    if (cached && Date.now() - cached.timestamp < FIVE_MINUTES) {
      console.log("💾 Cache hit for topic:", topic);
      setQuestions(cached.questions);
      return;
    }

    // Cache expired or missing — reset topicRef so hook can refetch
    if (cached && Date.now() - cached.timestamp >= FIVE_MINUTES) {
      console.log("⏰ Cache expired for topic:", topic, "— refetching");
      topicRef.current = null;
      delete cacheRef.current[topic];
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    let cancelled = false;

    async function generateQuestions() {
      setIsLoading(true);
      setError("");

      try {
        console.log("🚀 Fetching questions for topic:", topic);
        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              temperature: 0.9,
              max_tokens: 2000,
              messages: [
                {
                  role: "system",
                  content:
                    "You are a quiz question generator. Return ONLY a valid JSON array. No markdown, no backticks, no explanation. Just the raw JSON array.",
                },
                {
                  role: "user",
                  content: `Generate 10 quiz questions about ${topic}.
Each object must have exactly:
{ "question": string, "options": [string, string, string, string], "correctIndex": number, "difficulty": "easy"|"medium"|"hard", "points": number }
correctIndex is the index (0-3) of the correct answer in the options array.
IMPORTANT: Vary the correctIndex — do not always put the correct answer first.
Distribute correctIndex values across 0, 1, 2, and 3 randomly.
points: easy=10, medium=15, hard=20. Mix: 3 easy, 4 medium, 3 hard.`,
                },
              ],
            }),
          },
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            `Groq error: ${response.status} — ${errData?.error?.message || "unknown"}`,
          );
        }

        const data = await response.json();
        const text = data.choices[0].message.content;
        const clean = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);

        if (!Array.isArray(parsed)) throw new Error("Invalid response format");

        const normalized = parsed.map(normalizeQuestion).filter(Boolean);
        console.log(
          "✅ AI questions ready:",
          normalized.length,
          "for topic:",
          topic,
        );

        if (!cancelled) {
          // Store with timestamp for expiry
          cacheRef.current[topic] = {
            questions: normalized,
            timestamp: Date.now(),
          };
          setQuestions(normalized);
        }
      } catch (err) {
        console.error("❌ Question generation failed:", err);
        if (!cancelled) {
          setQuestions([]);
          setError(err.message || "Failed to generate questions.");
        }
      } finally {
        isFetchingRef.current = false;
        if (!cancelled) setIsLoading(false);
      }
    }

    generateQuestions();
    return () => {
      cancelled = true;
    };
  }, [topic]);

  return { questions, isLoading, error };
}
