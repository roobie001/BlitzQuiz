import { useState } from "react";

function generateShareText(score, correctAnswers, bestStreak) {
  return `🎮 BlitzQuiz Score: ${score}
✅ ${correctAnswers} correct answers
🔥 Best streak: ${bestStreak}x
⛓️ Posted onchain on Celo!
Play here → https://blitz-quiz-pink.vercel.app/`;
}

export function ShareButton({ score, correctAnswers, bestStreak, onCopied }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = generateShareText(score, correctAnswers, bestStreak);
    if (navigator.share) {
      try {
        await navigator.share({ title: "BlitzQuiz", text });
      } catch {
        /* user cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        onCopied?.();
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* clipboard not available */
      }
    }
  }

  return (
    <button className="share-btn" onClick={handleShare}>
      {copied ? "✅ Copied!" : "📤 Share Score"}
    </button>
  );
}
