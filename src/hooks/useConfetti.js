import confetti from "canvas-confetti";

export function useConfetti() {
  function fireConfetti() {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#00e676", "#ffffff", "#7c3aed"],
    });
  }

  function fireStreakConfetti() {
    confetti({
      particleCount: 50,
      spread: 40,
      origin: { y: 0.7 },
      colors: ["#ff9100", "#ff1744"],
    });
  }

  return { fireConfetti, fireStreakConfetti };
}
