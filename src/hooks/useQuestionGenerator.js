import { useEffect, useRef, useState } from "react";

const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);

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

  const correctAnswer = String(question.options[correctIndex]);

  return {
    id: `${difficulty}-${index}-${question.question}`,
    question: question.question.trim(),
    options: question.options.map((o) => String(o)),
    correctIndex,
    answer: correctAnswer,
    difficulty,
    points: difficulty === "easy" ? 10 : difficulty === "medium" ? 15 : 20,
  };
}

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

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setError("Missing Gemini API key.");
      return;
    }

    if (cacheRef.current[topic]) {
      console.log("💾 Cache hit for topic:", topic);
      setQuestions(cacheRef.current[topic]);
      return;
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
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Generate 10 quiz questions about ${topic}.
Return ONLY a valid JSON array, no markdown, no backticks, no explanation.
Each object must have exactly:
{ "question": string, "options": [string, string, string, string], "correctIndex": number, "difficulty": "easy"|"medium"|"hard", "points": number }
correctIndex is the index (0-3) of the correct answer in the options array.
points: easy=10, medium=15, hard=20. Mix: 3 easy, 4 medium, 3 hard.`,
                    },
                  ],
                },
              ],
              generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
            }),
          },
        );

        if (!response.ok) throw new Error(`Gemini error: ${response.status}`);

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
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
          cacheRef.current[topic] = normalized;
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
