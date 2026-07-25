export function WelcomeModal({ onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <h2>Welcome to BlitzQuiz! 🎮</h2>
        <div className="modal-steps">
          <div className="modal-step">
            <span className="step-num">1</span>
            <div>
              <strong>Pick a topic</strong>
              <p>Choose from Crypto, Science, Sports and more</p>
            </div>
          </div>
          <div className="modal-step">
            <span className="step-num">2</span>
            <div>
              <strong>Answer fast</strong>
              <p>AI generates 10 questions — race the 60s clock</p>
            </div>
          </div>
          <div className="modal-step">
            <span className="step-num">3</span>
            <div>
              <strong>Post onchain</strong>
              <p>Submit your score to the Celo leaderboard</p>
            </div>
          </div>
        </div>
        <button className="primary-button" onClick={onClose}>
          Let's Play! 🚀
        </button>
      </div>
    </div>
  );
}
