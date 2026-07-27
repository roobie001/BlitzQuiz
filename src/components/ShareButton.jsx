import { useState } from "react";

function generateShareText(score, correctAnswers, bestStreak, mode, lives) {
  const livesInfo =
    mode === "survival" ? `\n❤️ Survived with ${lives} lives` : "";
  const modeLabel =
    mode === "timeattack"
      ? "⚡ Time Attack"
      : mode === "survival"
        ? "❤️ Survival"
        : mode === "practice"
          ? "📚 Practice"
          : "🕐 Classic";
  return `🎮 BlitzQuiz ${modeLabel} Score: ${score}
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

export function TwitterShareButton({ score, mode, topic }) {
  function handleTwitterShare() {
    const text = encodeURIComponent(
      `🎮 Just scored ${score} on BlitzQuiz (${mode} mode)!\n⛓️ Onchain on Celo\nPlay here → https://blitz-quiz-pink.vercel.app/`,
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  }

  return (
    <button className="twitter-share-btn" onClick={handleTwitterShare}>
      𝕏 Share on X
    </button>
  );
}
