export function StatsModal({ stats, bestStreak, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <h2>Your Stats 📊</h2>
      </div>
    </div>
  );
}
