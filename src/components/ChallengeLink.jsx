import { useState } from "react";

function generateChallengeUrl(score, mode, topic) {
  const base = "https://blitz-quiz-pink.vercel.app";
  const params = new URLSearchParams({
    challenge: score,
    mode: mode || "classic",
    topic: topic || "",
  });
  return `${base}?${params.toString()}`;
}

export function ChallengeLink({ score, mode, topic, onCopied }) {
  const [copied, setCopied] = useState(false);

  async function handleChallenge() {
    const url = generateChallengeUrl(score, mode, topic);
    const text = `🎯 Can you beat my BlitzQuiz score of ${score}?\n${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "BlitzQuiz Challenge", text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        onCopied?.();
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="challenge-link-wrap">
      <button className="challenge-btn" onClick={handleChallenge}>
        {copied ? "✅ Link Copied!" : "🎯 Challenge a Friend"}
      </button>
    </div>
  );
}
