export function StreakBadge({ streak }) {
  if (streak < 2) return null;

  const emoji = streak >= 10 ? "🔥🔥🔥" : streak >= 5 ? "🔥🔥" : "🔥";

  const label =
    streak >= 10
      ? "LEGENDARY!"
      : streak >= 5
        ? "ON FIRE!"
        : streak >= 3
          ? "Keep going!"
          : "streak!";

  return (
    <div className="streak-badge">
      {emoji} {streak}x {label}
    </div>
  );
}
