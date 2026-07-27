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

export function TelegramShareButton({ score }) {
  function handleTelegramShare() {
    const text = encodeURIComponent(
      `🎮 Just scored ${score} on BlitzQuiz!\n⛓️ Onchain on Celo\nhttps://blitz-quiz-pink.vercel.app/`,
    );
    window.open(
      `https://t.me/share/url?url=https://blitz-quiz-pink.vercel.app/&text=${text}`,
      "_blank",
    );
  }

  return (
    <button className="telegram-share-btn" onClick={handleTelegramShare}>
      ✈️ Share on Telegram
    </button>
  );
}

export function WhatsAppShareButton({ score }) {
  function handleWhatsAppShare() {
    const text = encodeURIComponent(
      `🎮 Just scored ${score} on BlitzQuiz!\n⛓️ Onchain on Celo\nhttps://blitz-quiz-pink.vercel.app/`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  return (
    <button className="whatsapp-share-btn" onClick={handleWhatsAppShare}>
      💬 Share on WhatsApp
    </button>
  );
}

export function FarcasterShareButton({ score }) {
  function handleFarcasterShare() {
    const text = encodeURIComponent(
      `🎮 Just scored ${score} on BlitzQuiz!\n⛓️ Onchain on Celo /celo\nhttps://blitz-quiz-pink.vercel.app/`,
    );
    window.open(`https://warpcast.com/~/compose?text=${text}`, "_blank");
  }

  return (
    <button className="farcaster-share-btn" onClick={handleFarcasterShare}>
      🟣 Share on Farcaster
    </button>
  );
}
