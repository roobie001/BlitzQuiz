const POINTS = { easy: 10, medium: 15, hard: 20 };

export function DifficultyBadge({ difficulty }) {
  return (
    <span className={`difficulty-badge ${difficulty}`}>
      {difficulty} · {POINTS[difficulty]}pts
    </span>
  );
}
