import { useState } from "react";

function generateShareText(score, correctAnswers, bestStreak) {
  return `🎮 BlitzQuiz Score: ${score}
✅ ${correctAnswers} correct answers
🔥 Best streak: ${bestStreak}x
⛓️ Posted onchain on Celo!
Play here → https://blitz-quiz-pink.vercel.app/`;
}

export function ShareButton({ score, correctAnswers, bestStreak }) {
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
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      className="share-btn"
      onClick={handleShare}
      onCopy={setShowToast}
      onCopied={showToastMessage}
    >
      {copied ? "✅ Copied!" : "📤 Share Score"}
    </button>
  );
}
