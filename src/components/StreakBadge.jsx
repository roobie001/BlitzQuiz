export function StreakBadge({ streak }) {
  if (streak < 2) return null;

  const emoji = streak >= 10 ? "🔥🔥🔥" : streak >= 5 ? "🔥🔥" : "🔥";

  return (
    <div className="streak-badge">
      {emoji} {streak} streak!
    </div>
  );
}
