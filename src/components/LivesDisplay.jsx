export function LivesDisplay({ lives, mode }) {
  if (mode !== "survival") return null;
  return (
    <div className="lives-display">
      {Array.from({ length: 3 }).map((_, i) => (
        <span key={i} className={`heart ${i < lives ? "alive" : "dead"}`}>
          ❤️
        </span>
      ))}
    </div>
  );
}
