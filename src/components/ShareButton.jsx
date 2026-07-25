function generateShareText(score, correctAnswers, bestStreak) {
  return `🎮 BlitzQuiz Score: ${score}
✅ ${correctAnswers} correct answers
🔥 Best streak: ${bestStreak}x
⛓️ Posted onchain on Celo!
Play here → https://blitz-quiz-pink.vercel.app/`;
}

export function ShareButton({ score, correctAnswers, bestStreak }) {
  function handleShare() {
    const text = generateShareText(score, correctAnswers, bestStreak);
    if (navigator.share) {
      navigator.share({ title: "BlitzQuiz", text });
    } else {
      navigator.clipboard.writeText(text);
    }
  }

  return (
    <button className="share-btn" onClick={handleShare}>
      📤 Share Score
    </button>
  );
}
