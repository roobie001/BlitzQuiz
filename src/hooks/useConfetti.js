import confetti from "canvas-confetti";
import { useEffect } from "react";

export function useConfetti() {
  useEffect(() => {
    return () => confetti.reset();
  }, []);

  function fireConfetti() {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#00e676", "#ffffff", "#7c3aed", "#ff9100"],
    });
  }

  function fireStreakConfetti() {
    confetti({
      particleCount: 60,
      spread: 45,
      origin: { y: 0.7 },
      colors: ["#ff9100", "#ff1744", "#ffffff"],
    });
  }

  return { fireConfetti, fireStreakConfetti };
}
