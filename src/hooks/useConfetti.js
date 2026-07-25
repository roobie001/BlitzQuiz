import confetti from "canvas-confetti";

const THEME_COLORS = ["#00e676", "#ffffff", "#7c3aed", "#ff9100"];
const STREAK_COLORS = ["#ff9100", "#ff1744", "#ffffff"];

export function useConfetti() {
  function fireConfetti(colors = THEME_COLORS) {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors });
  }

  function fireStreakConfetti() {
    confetti({
      particleCount: 60,
      spread: 45,
      origin: { y: 0.7 },
      colors: STREAK_COLORS,
    });
  }

  return { fireConfetti, fireStreakConfetti };
}
