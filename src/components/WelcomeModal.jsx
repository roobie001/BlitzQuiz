export function WelcomeModal({ onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Welcome to BlitzQuiz! 🎮</h2>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
}
