export function ChallengeBanner({ score, mode, topic }) {
  if (!score) return null;
  return (
    <div className="challenge-banner">
      <span className="challenge-banner-icon">🎯</span>
      <div>
        <strong>You've been challenged!</strong>
        <p>
          Beat a score of <strong>{score}</strong> in {mode} mode
          {topic ? ` on ${topic}` : ""}
        </p>
      </div>
    </div>
  );
}
