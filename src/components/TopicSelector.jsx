const TOPICS = [
  'Crypto & Web3',
  'Science',
  'History',
  'Sports',
  'Pop Culture',
  'General knowledge',
]

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '12px',
  marginTop: '16px',
}

const buttonStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  background: 'rgba(255, 255, 255, 0.05)',
  color: '#f5f7ff',
  padding: '14px 16px',
  cursor: 'pointer',
  textAlign: 'left',
  font: 'inherit',
}

const selectedButtonStyle = {
  border: '1px solid #18c67a',
  boxShadow: '0 0 0 1px rgba(24, 198, 122, 0.2)',
}

export function TopicSelector({ onTopicSelect, selectedTopic, isLoading }) {
  return (
    <div className="card">
      <p className="card-tag">AI Topics</p>
      <h3>Choose a question theme</h3>
      <div style={gridStyle}>
        {TOPICS.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => onTopicSelect(topic)}
            style={{
              ...buttonStyle,
              ...(selectedTopic === topic ? selectedButtonStyle : {}),
            }}
          >
            {topic}
          </button>
        ))}
      </div>
      {isLoading && (
        <p
          style={{
            marginTop: '12px',
            color: 'rgba(245, 247, 255, 0.76)',
          }}
        >
          Generating questions...
        </p>
      )}
    </div>
  )
}
