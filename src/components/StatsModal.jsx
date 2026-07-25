export function StatsModal({ stats, bestStreak, onClose }) {
  const avgScore =
    stats.totalGames > 0 ? Math.round(stats.bestScore / stats.totalGames) : 0;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <h2>Your Stats 📊</h2>
        <div className="stats-modal-grid">
          <div className="stats-modal-item">
            <span>Best Score</span>
            <strong>{stats.bestScore}</strong>
          </div>
          <div className="stats-modal-item">
            <span>Total Games</span>
            <strong>{stats.totalGames}</strong>
          </div>
          <div className="stats-modal-item">
            <span>Best Streak</span>
            <strong>🔥 {bestStreak}x</strong>
          </div>
          <div className="stats-modal-item">
            <span>Avg Score</span>
            <strong>{avgScore}</strong>
          </div>
        </div>
        {stats.bestScore >= 100 && (
          <div className="rank-badge">🏆 Elite Player</div>
        )}
        {stats.bestScore >= 50 && stats.bestScore < 100 && (
          <div className="rank-badge">⭐ Rising Star</div>
        )}
        <button className="primary-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
