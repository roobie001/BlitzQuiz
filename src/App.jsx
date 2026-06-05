import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import staticQuestions from "./data/questions.json";
import {
  CONTRACT_ADDRESS,
  getLeaderboardEntries,
  getPlayerStats,
} from "./lib/contract";
import { useMiniPay } from "./useMiniPay";
import { useQuestionGenerator } from "./hooks/useQuestionGenerator";

const GAME_DURATION = 60;
const QUESTIONS_PER_GAME = 10;
const ROUND_DISTRIBUTION = { easy: 4, medium: 4, hard: 2 };
const POINTS_MAP = { easy: 10, medium: 15, hard: 20 };

const TOPICS = [
  { id: "Crypto & Web3", emoji: "🔗" },
  { id: "Science", emoji: "🔬" },
  { id: "History", emoji: "📜" },
  { id: "Sports", emoji: "⚽" },
  { id: "Pop Culture", emoji: "🎬" },
  { id: "General Knowledge", emoji: "🎲" },
];

function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom(items, count) {
  return shuffleArray(items).slice(0, Math.min(count, items.length));
}

function buildRoundQuestions(pool) {
  const valid = pool.filter((q) =>
    ["easy", "medium", "hard"].includes(q.difficulty),
  );
  const easy = valid.filter((q) => q.difficulty === "easy");
  const medium = valid.filter((q) => q.difficulty === "medium");
  const hard = valid.filter((q) => q.difficulty === "hard");

  let round = [];
  if (
    easy.length >= ROUND_DISTRIBUTION.easy &&
    medium.length >= ROUND_DISTRIBUTION.medium &&
    hard.length >= ROUND_DISTRIBUTION.hard
  ) {
    round = [
      ...pickRandom(easy, ROUND_DISTRIBUTION.easy),
      ...pickRandom(medium, ROUND_DISTRIBUTION.medium),
      ...pickRandom(hard, ROUND_DISTRIBUTION.hard),
    ];
  } else {
    round = pickRandom(valid.length > 0 ? valid : pool, QUESTIONS_PER_GAME);
  }

  return shuffleArray(round).map((q) => ({ ...q }));
}

function shortenAddress(addr) {
  if (!addr) return "Not connected";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function TimerRing({ timeLeft, total = GAME_DURATION }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - timeLeft / total);
  const color = timeLeft > 20 ? "green" : timeLeft > 10 ? "orange" : "red";

  return (
    <div className="timer-section">
      <div className="timer-ring-wrap">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle className="timer-ring-bg" cx="50" cy="50" r={r} />
          <circle
            className={`timer-ring-bar ${color}`}
            cx="50"
            cy="50"
            r={r}
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </svg>
        <div className={`timer-number ${color}`}>{timeLeft}</div>
      </div>
    </div>
  );
}

export default function App() {
  const {
    account,
    chainId,
    connectWallet,
    detectedAccount,
    disconnectWallet,
    isConnecting,
    isMiniPay,
    isOnSupportedChain,
    publicClient,
    submitScore,
    switchToSupportedChain,
    supportedChain,
    txError,
    txStatus,
  } = useMiniPay();

  const [selectedTopic, setSelectedTopic] = useState(null);
  const { questions: aiQuestions, isLoading: isGeneratingQuestions } =
    useQuestionGenerator(selectedTopic);

  const [gameState, setGameState] = useState("idle");
  const [gameQuestions, setGameQuestions] = useState(() =>
    buildRoundQuestions(staticQuestions),
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [finalScore, setFinalScore] = useState(0);
  const [hasSubmittedRound, setHasSubmittedRound] = useState(false);
  const [flashAnswer, setFlashAnswer] = useState(null); // {index, correct}
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerStats, setPlayerStats] = useState({
    bestScore: 0,
    totalGames: 0,
  });
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [boardError, setBoardError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [boardOpen, setBoardOpen] = useState(false);

  const correctAnswersRef = useRef(correctAnswers);
  const totalPointsRef = useRef(totalPoints);
  const timeLeftRef = useRef(timeLeft);

  const currentQuestion = gameQuestions[currentQuestionIndex];

  const canSubmitScore =
    Boolean(account) &&
    Boolean(CONTRACT_ADDRESS) &&
    isOnSupportedChain &&
    finalScore > 0 &&
    !hasSubmittedRound;

  const liveScore = useMemo(
    () => totalPoints + timeLeft,
    [timeLeft, totalPoints],
  );

  useEffect(() => {
    correctAnswersRef.current = correctAnswers;
    totalPointsRef.current = totalPoints;
    timeLeftRef.current = timeLeft;
  }, [correctAnswers, timeLeft, totalPoints]);

  function endGame(
    remainingTime = timeLeftRef.current,
    finalPoints = totalPointsRef.current,
  ) {
    setGameState((s) => {
      if (s !== "playing") return s;
      setFinalScore(finalPoints + remainingTime);
      return "finished";
    });
  }

  useEffect(() => {
    if (gameState !== "playing") return;
    const timer = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(timer);
          endGame(0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState === "playing" && currentQuestionIndex >= gameQuestions.length)
      endGame();
  }, [currentQuestionIndex, gameQuestions.length, gameState]);

  useEffect(() => {
    if (!publicClient || !CONTRACT_ADDRESS) return;
    let cancelled = false;
    async function loadLeaderboard() {
      setLoadingBoard(true);
      setBoardError("");
      try {
        const [entries, stats] = await Promise.all([
          getLeaderboardEntries(publicClient),
          account
            ? getPlayerStats(publicClient, account)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setLeaderboard(entries);
        if (stats) setPlayerStats(stats);
      } catch (err) {
        if (cancelled) return;
        setBoardError(
          err.shortMessage || err.message || "Unable to load leaderboard.",
        );
      } finally {
        if (!cancelled) setLoadingBoard(false);
      }
    }
    loadLeaderboard();
    return () => {
      cancelled = true;
    };
  }, [account, publicClient, refreshTick]);

  function startGame() {
    const pool =
      selectedTopic && aiQuestions.length > 0 ? aiQuestions : staticQuestions;
    setGameQuestions(buildRoundQuestions(pool));
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setTotalPoints(0);
    setAnsweredQuestions(0);
    setTimeLeft(GAME_DURATION);
    setFinalScore(0);
    setHasSubmittedRound(false);
    setFlashAnswer(null);
    setGameState("playing");
  }

  function handleAnswer(selectedAnswer, optionIndex) {
    if (gameState !== "playing" || !currentQuestion) return;
    const isCorrect = selectedAnswer === currentQuestion.answer;
    const questionPoints = POINTS_MAP[currentQuestion.difficulty] ?? 10;
    const nextPoints = totalPoints + (isCorrect ? questionPoints : 0);
    const nextIndex = currentQuestionIndex + 1;

    setFlashAnswer({ index: optionIndex, correct: isCorrect });
    setTimeout(() => {
      setFlashAnswer(null);
      setAnsweredQuestions((c) => c + 1);
      if (isCorrect) {
        setCorrectAnswers((c) => c + 1);
        setTotalPoints((p) => p + questionPoints);
      }
      if (nextIndex >= gameQuestions.length) {
        endGame(timeLeft, nextPoints);
        return;
      }
      setCurrentQuestionIndex(nextIndex);
    }, 300);
  }

  async function handleSubmitScore() {
    try {
      await submitScore(finalScore);
      setHasSubmittedRound(true);
      setRefreshTick((v) => v + 1);
    } catch {
      /* surfaced by hook */
    }
  }

  const rankClass = (i) =>
    i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "other";

  return (
    <div className="app-shell">
      {/* ── Header ── */}
      <header className="app-header">
        <span className="app-logo">BlitzQuiz</span>
        <div
          className="wallet-chip"
          onClick={account ? undefined : connectWallet}
        >
          <span className={`wallet-dot ${account ? "connected" : ""}`} />
          {account
            ? shortenAddress(account)
            : detectedAccount
              ? "Tap to connect"
              : "No wallet"}
        </div>
      </header>

      {/* ── Game State: idle or finished ── */}
      {gameState !== "playing" && (
        <>
          {/* Topic Selector */}
          <div className="card topic-section" style={{ marginBottom: 16 }}>
            <div className="topic-label">Choose a topic</div>
            <div className="topic-grid">
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  className={`topic-btn${selectedTopic === t.id ? " selected" : ""}${isGeneratingQuestions ? " loading" : ""}`}
                  onClick={() =>
                    setSelectedTopic((cur) => (cur === t.id ? cur : t.id))
                  }
                  disabled={isGeneratingQuestions}
                >
                  <span className="topic-emoji">{t.emoji}</span>
                  {t.id}
                </button>
              ))}
            </div>
            {isGeneratingQuestions && (
              <div className="topic-generating">
                <span className="spinner" />
                Generating questions…
              </div>
            )}
          </div>

          {/* Start Button */}
          <button
            className={`start-btn${isGeneratingQuestions ? " loading-state" : ""}`}
            onClick={startGame}
            disabled={isGeneratingQuestions}
          >
            {isGeneratingQuestions ? (
              <>
                <span className="spinner" /> Generating…
              </>
            ) : gameState === "finished" ? (
              "Play Again"
            ) : (
              "Start Game"
            )}
          </button>

          {/* Result Card */}
          {gameState === "finished" && (
            <div className="card result-card" style={{ marginBottom: 16 }}>
              <div className="result-label">Final Score</div>
              <div className="result-score">{finalScore}</div>
              <div className="result-sub">{correctAnswers} correct answers</div>
              <div className="result-actions">
                <button
                  className="primary-button"
                  onClick={handleSubmitScore}
                  disabled={!canSubmitScore || txStatus === "pending"}
                >
                  {txStatus === "pending"
                    ? "Submitting…"
                    : hasSubmittedRound
                      ? "✓ Submitted"
                      : "Submit Score Onchain"}
                </button>
                {!account && (
                  <button
                    className="secondary-button"
                    onClick={connectWallet}
                    disabled={isConnecting}
                  >
                    {isConnecting ? "Connecting…" : "Connect MiniPay"}
                  </button>
                )}
                {account && !isOnSupportedChain && (
                  <button
                    className="secondary-button"
                    onClick={switchToSupportedChain}
                  >
                    Switch to {supportedChain.name}
                  </button>
                )}
                {txStatus === "success" && (
                  <p className="success-text">✓ Score posted onchain!</p>
                )}
                {txError && <p className="error-text">{txError}</p>}
                {!CONTRACT_ADDRESS && (
                  <p className="hint">
                    Set <code>VITE_CONTRACT_ADDRESS</code> to enable submission.
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Game State: playing ── */}
      {gameState === "playing" && (
        <>
          <TimerRing timeLeft={timeLeft} />
          <div className="score-mini">
            Base <strong>{totalPoints}</strong> &nbsp;·&nbsp; Potential{" "}
            <strong>{liveScore}</strong>
          </div>

          {currentQuestion && (
            <div className="card question-card" style={{ marginTop: 16 }}>
              <div className="q-meta">
                <span>
                  Q{currentQuestionIndex + 1} / {gameQuestions.length}
                </span>
                <span>{answeredQuestions} answered</span>
              </div>
              <div className="q-text">{currentQuestion.question}</div>
              <div className="answer-grid">
                {currentQuestion.options.map((option, i) => {
                  let cls = "answer-button";
                  if (flashAnswer?.index === i) {
                    cls += flashAnswer.correct ? " correct" : " wrong";
                  }
                  return (
                    <button
                      key={option}
                      className={cls}
                      onClick={() => handleAnswer(option, i)}
                      disabled={flashAnswer !== null}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="section-divider" />

      {/* ── Wallet Card ── */}
      <div className="card wallet-card" style={{ marginBottom: 16 }}>
        <div className="wallet-card-title">Wallet & Chain</div>
        <p>
          {isMiniPay
            ? "MiniPay detected."
            : "Injected wallet fallback for desktop testing."}
        </p>
        {detectedAccount && !account && (
          <p>Found: {shortenAddress(detectedAccount)}. Tap connect to use.</p>
        )}
        <div className="wallet-actions">
          {!account ? (
            <button
              className="connect-btn"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting…" : "Connect Wallet"}
            </button>
          ) : (
            <>
              <button className="connect-btn connected" disabled>
                {shortenAddress(account)}
              </button>
              <button className="disconnect-btn" onClick={disconnectWallet}>
                Disconnect
              </button>
            </>
          )}
        </div>
        {account && !isOnSupportedChain && (
          <button
            className="secondary-button"
            style={{ marginTop: 10 }}
            onClick={switchToSupportedChain}
          >
            Switch to {supportedChain.name}
          </button>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="card stats-card" style={{ marginBottom: 16 }}>
        <div className="stats-card-title">Your Stats</div>
        <div className="stats-grid">
          <div>
            <span>Best Score</span>
            <strong>{playerStats.bestScore}</strong>
          </div>
          <div>
            <span>Total Games</span>
            <strong>{playerStats.totalGames}</strong>
          </div>
        </div>
      </div>

      {/* ── Leaderboard ── */}
      <div className="card leaderboard-card">
        <div
          className="leaderboard-toggle"
          onClick={() => setBoardOpen((o) => !o)}
        >
          <div className="leaderboard-toggle-title">🏆 Top Scores</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              className="leaderboard-refresh"
              onClick={(e) => {
                e.stopPropagation();
                setRefreshTick((v) => v + 1);
              }}
            >
              Refresh
            </button>
            <span className={`leaderboard-chevron ${boardOpen ? "open" : ""}`}>
              ▼
            </span>
          </div>
        </div>
        <div className={`leaderboard-body ${boardOpen ? "open" : ""}`}>
          {loadingBoard && (
            <p
              style={{
                color: "var(--text-dim)",
                fontSize: "0.85rem",
                marginTop: 12,
              }}
            >
              Loading…
            </p>
          )}
          {boardError && (
            <p className="error-text" style={{ marginTop: 12 }}>
              {boardError}
            </p>
          )}
          {!loadingBoard && !boardError && leaderboard.length === 0 && (
            <p
              style={{
                color: "var(--text-dim)",
                fontSize: "0.85rem",
                marginTop: 12,
              }}
            >
              No scores yet. Play and submit to claim the top spot!
            </p>
          )}
          <div className="leaderboard-list">
            {leaderboard.map((entry, i) => (
              <div
                className={`leaderboard-row ${rankClass(i)}`}
                key={entry.address}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span className={`rank ${rankClass(i)}`}>#{i + 1}</span>
                  <span className="leaderboard-address">
                    {shortenAddress(entry.address)}
                  </span>
                </div>
                <div className="leaderboard-score">
                  <span>{entry.totalGames} games</span>
                  <strong>{entry.bestScore}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
