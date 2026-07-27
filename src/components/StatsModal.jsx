export function StatsModal({ stats, bestStreak, getBestByMode, onClose }) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
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
            <span>⚡ Time Attack</span>
            <strong>{getBestByMode("timeattack") || "—"}</strong>
          </div>
          <div className="stats-modal-item">
            <span>❤️ Survival</span>
            <strong>{getBestByMode("survival") || "—"}</strong>
          </div>
          <div className="stats-modal-item">
            <span>⏱️ Classic</span>
            <strong>{getBestByMode("classic") || "—"}</strong>
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
