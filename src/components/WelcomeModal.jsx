import { useState } from "react";

export function WelcomeModal({ onClose }) {
  const [dontShow, setDontShow] = useState(false);

  function handleClose() {
    if (dontShow) localStorage.setItem("blitzquiz-seen", "true");
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="modal-close" onClick={handleClose}>
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
        <label className="modal-checkbox">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
          />
          Don't show again
        </label>
        <button className="primary-button" onClick={handleClose}>
          Let's Play! 🚀
        </button>
      </div>
    </div>
  );
}
