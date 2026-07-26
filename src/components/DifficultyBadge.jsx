const POINTS = { easy: 10, medium: 15, hard: 20 };

export function DifficultyBadge({ difficulty, multiplier = 1 }) {
  const pts = Math.round(POINTS[difficulty] * multiplier);
  return (
    <span className={`difficulty-badge ${difficulty}`}>
      {difficulty} · {pts}pts{multiplier > 1 ? " ⚡" : ""}
    </span>
  );
}
