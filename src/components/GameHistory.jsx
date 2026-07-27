export function GameHistory({ history, onClear }) {
  if (history.length === 0) return null;

  return (
    <div className="card game-history" style={{ marginBottom: 16 }}>
      <div className="game-history-header">
        <div className="stats-card-title">Recent Games</div>
        <button className="leaderboard-refresh" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="history-list">
        {history.map((entry, i) => (
          <div key={i} className="history-row">
            <div className="history-left">
              <span className="history-score">{entry.score}</span>
              <span className="history-meta">
                {entry.topic} · {entry.mode}
              </span>
            </div>
            <div className="history-right">
              <span className="history-correct">
                {entry.correctAnswers} correct
              </span>
              <span className="history-date">
                {new Date(entry.date).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
