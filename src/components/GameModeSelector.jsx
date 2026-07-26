export function GameModeSelector({ mode, onSelect }) {
  const modes = [
    { id: "classic", emoji: "⏱️", label: "Classic", desc: "60 seconds" },
    { id: "timeattack", emoji: "⚡", label: "Time Attack", desc: "30 seconds" },
    { id: "survival", emoji: "❤️", label: "Survival", desc: "One life" },
    { id: "practice", emoji: "📚", label: "Practice", desc: "No timer" },
  ];

  return (
    <div className="mode-selector">
      <div className="topic-label">Game Mode</div>
      <div className="mode-grid">
        {modes.map((m) => (
          <button
            key={m.id}
            className={`mode-btn${mode === m.id ? " selected" : ""}`}
            onClick={() => onSelect(m.id)}
          >
            <span className="mode-emoji">{m.emoji}</span>
            <span className="mode-label">{m.label}</span>
            <span className="mode-desc">{m.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
