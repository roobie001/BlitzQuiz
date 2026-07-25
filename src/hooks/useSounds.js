export function useSounds(enabled) {
  function playTone(frequency, duration, type = "sine") {
    if (!enabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + duration,
      );
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      /* audio not supported */
    }
  }

  return {
    playCorrect: () => playTone(880, 0.15),
    playWrong: () => playTone(220, 0.3, "sawtooth"),
    playStart: () => playTone(660, 0.1),
    playEnd: () => playTone(440, 0.5),
    playStreak: () => playTone(1100, 0.2),
  };
}
