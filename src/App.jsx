import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import questions from './data/questions.json'
import { CONTRACT_ADDRESS, getLeaderboardEntries, getPlayerStats } from './lib/contract'
import { useMiniPay } from './useMiniPay'

const GAME_DURATION = 60
const QUESTIONS_PER_GAME = 12

function shuffleArray(items) {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]]
  }

  return copy
}

function buildRoundQuestions(pool) {
  return shuffleArray(pool)
    .slice(0, Math.min(QUESTIONS_PER_GAME, pool.length))
    .map((question) => ({
      ...question,
      options: shuffleArray(question.options),
    }))
}

function shortenAddress(address) {
  if (!address) return 'Not connected'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function App() {
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
  } = useMiniPay()
  const [gameState, setGameState] = useState('idle')
  const [gameQuestions, setGameQuestions] = useState(() => buildRoundQuestions(questions))
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [finalScore, setFinalScore] = useState(0)
  const [hasSubmittedRound, setHasSubmittedRound] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [playerStats, setPlayerStats] = useState({ bestScore: 0, totalGames: 0 })
  const [loadingBoard, setLoadingBoard] = useState(false)
  const [boardError, setBoardError] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)
  const correctAnswersRef = useRef(correctAnswers)
  const timeLeftRef = useRef(timeLeft)

  const currentQuestion = gameQuestions[currentQuestionIndex]
  const canSubmitScore =
    Boolean(account) &&
    Boolean(CONTRACT_ADDRESS) &&
    isOnSupportedChain &&
    finalScore > 0 &&
    !hasSubmittedRound

  const liveScore = useMemo(
    () => correctAnswers * 10 + timeLeft,
    [correctAnswers, timeLeft],
  )
  const baseScore = useMemo(() => correctAnswers * 10, [correctAnswers])

  useEffect(() => {
    correctAnswersRef.current = correctAnswers
    timeLeftRef.current = timeLeft
  }, [correctAnswers, timeLeft])

  function endGame(
    remainingTime = timeLeftRef.current,
    finalCorrect = correctAnswersRef.current,
  ) {
    setGameState((currentState) => {
      if (currentState !== 'playing') return currentState
      setFinalScore(finalCorrect * 10 + remainingTime)
      return 'finished'
    })
  }

  useEffect(() => {
    if (gameState !== 'playing') return undefined

    const timer = window.setInterval(() => {
      setTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          window.clearInterval(timer)
          endGame(0)
          return 0
        }

        return currentTime - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [gameState])

  useEffect(() => {
    if (gameState === 'playing' && currentQuestionIndex >= gameQuestions.length) {
      endGame()
    }
  }, [currentQuestionIndex, gameQuestions.length, gameState])

  useEffect(() => {
    if (!publicClient || !CONTRACT_ADDRESS) return undefined

    let cancelled = false

    async function loadLeaderboard() {
      setLoadingBoard(true)
      setBoardError('')

      try {
        const [entries, stats] = await Promise.all([
          getLeaderboardEntries(publicClient),
          account ? getPlayerStats(publicClient, account) : Promise.resolve(null),
        ])

        if (cancelled) return

        setLeaderboard(entries)
        if (stats) {
          setPlayerStats(stats)
        }
      } catch (error) {
        if (cancelled) return
        setBoardError(error.shortMessage || error.message || 'Unable to load leaderboard.')
      } finally {
        if (!cancelled) {
          setLoadingBoard(false)
        }
      }
    }

    loadLeaderboard()

    return () => {
      cancelled = true
    }
  }, [account, publicClient, refreshTick])

  function startGame() {
    setGameQuestions(buildRoundQuestions(questions))
    setCurrentQuestionIndex(0)
    setCorrectAnswers(0)
    setAnsweredQuestions(0)
    setTimeLeft(GAME_DURATION)
    setFinalScore(0)
    setHasSubmittedRound(false)
    setGameState('playing')
  }

  function handleAnswer(selectedAnswer) {
    if (gameState !== 'playing' || !currentQuestion) return

    const isCorrect = selectedAnswer === currentQuestion.answer
    const nextCorrectAnswers = correctAnswers + (isCorrect ? 1 : 0)
    const nextQuestionIndex = currentQuestionIndex + 1

    setAnsweredQuestions((count) => count + 1)
    if (isCorrect) {
      setCorrectAnswers((count) => count + 1)
    }

    if (nextQuestionIndex >= gameQuestions.length) {
      endGame(timeLeft, nextCorrectAnswers)
      return
    }

    setCurrentQuestionIndex(nextQuestionIndex)
  }

  async function handleSubmitScore() {
    try {
      await submitScore(finalScore)
      setHasSubmittedRound(true)
      setRefreshTick((value) => value + 1)
    } catch {
      // Error state is surfaced by the hook so the UI stays simple here.
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Proof of Ship MiniPay Game</span>
          <h1>BlitzQuiz</h1>
          <p className="hero-lead">
            Race through a 60-second knowledge battle, lock in your score, and post
            it onchain with a single MiniPay transaction.
          </p>
          <div className="hero-explainer">
            <div className="explainer-item">
              <strong>1. Play fast</strong>
              <span>Answer as many quiz questions as you can in 60 seconds.</span>
            </div>
            <div className="explainer-item">
              <strong>2. Save time</strong>
              <span>Your final score is correct answers plus the seconds left on the clock.</span>
            </div>
            <div className="explainer-item">
              <strong>3. Submit once</strong>
              <span>Only one onchain transaction is used per completed game.</span>
            </div>
          </div>
        </div>

        <div className="status-strip">
          <div className="status-card">
            <span className="status-label">Wallet</span>
            <strong>
              {account
                ? shortenAddress(account)
                : detectedAccount
                  ? 'Wallet detected'
                  : 'Not connected'}
            </strong>
          </div>
          <div className="status-card">
            <span className="status-label">Network</span>
            <strong>
              {chainId ? `${supportedChain.name} (${chainId})` : 'Connect to continue'}
            </strong>
          </div>
          <div className="status-card">
            <span className="status-label">Contract</span>
            <strong>{CONTRACT_ADDRESS ? 'Configured' : 'Set env var'}</strong>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="game-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Game Screen</span>
              <h2>60s Knowledge Battle</h2>
              <p className="section-note">
                Build points from correct answers, then protect your time bonus before the
                timer runs out.
              </p>
            </div>
            <button className="ghost-button" onClick={startGame}>
              {gameState === 'playing' ? 'Restart Run' : 'Start Game'}
            </button>
          </div>

          <div className="score-ribbon">
            <div>
              <span>Timer</span>
              <strong>{timeLeft}s</strong>
            </div>
            <div>
              <span>Base Score</span>
              <strong>{baseScore}</strong>
            </div>
            <div>
              <span>Time Bonus</span>
              <strong>{timeLeft}</strong>
            </div>
            <div>
              <span>Potential Final</span>
              <strong>{liveScore}</strong>
            </div>
          </div>
          <p className="score-note">
            The total can go down during the round because the time bonus drops every second.
            Your correct-answer points never decrease.
          </p>

          {gameState !== 'playing' && (
            <div className="card game-card">
              <p className="card-tag">How scoring works</p>
              <h3>{gameState === 'finished' ? 'Round complete' : 'Tap in and play instantly'}</h3>
              <p>
                Score formula: <code>(correctAnswers * 10) + remainingTime</code>
              </p>
              <p>
                Answer fast. Every second left on the clock adds directly to your final
                result.
              </p>
              {gameState === 'finished' && (
                <div className="end-state">
                  <div className="final-score">
                    <span>Final Score</span>
                    <strong>{finalScore}</strong>
                  </div>
                  <button
                    className="primary-button"
                    onClick={handleSubmitScore}
                    disabled={!canSubmitScore || txStatus === 'pending'}
                  >
                    {txStatus === 'pending'
                      ? 'Submitting...'
                      : hasSubmittedRound
                        ? 'Score Submitted'
                        : 'Submit Score'}
                  </button>
                  <button className="ghost-button" onClick={startGame}>
                    Play Again
                  </button>
                  {!account && (
                    <button
                      className="secondary-button"
                      onClick={connectWallet}
                      disabled={isConnecting}
                    >
                      {isConnecting ? 'Connecting...' : 'Connect MiniPay'}
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
                  {!CONTRACT_ADDRESS && (
                    <p className="hint">
                      Add <code>VITE_CONTRACT_ADDRESS</code> after deployment to enable
                      score submission.
                    </p>
                  )}
                  {hasSubmittedRound && (
                    <p className="success-text">
                      This round is locked in. Start a new game to post another score.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {gameState === 'playing' && currentQuestion && (
            <div className="card game-card">
              <div className="question-meta">
                <span>
                  Question {currentQuestionIndex + 1} / {gameQuestions.length}
                </span>
                <span>{answeredQuestions} answered</span>
              </div>
              <h3>{currentQuestion.question}</h3>
              <div className="answer-grid">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option}
                    className="answer-button"
                    onClick={() => handleAnswer(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="side-panel">
          <div className="card wallet-card">
            <p className="card-tag">MiniPay</p>
            <h3>Wallet and chain</h3>
            <p>
              {isMiniPay
                ? 'MiniPay environment detected.'
                : 'Injected wallet fallback enabled for desktop testing.'}
            </p>
            {detectedAccount && !account && (
              <p className="section-note">
                Wallet found: {shortenAddress(detectedAccount)}. Tap connect to use it in
                BlitzQuiz.
              </p>
            )}
            <div className="wallet-actions">
              {!account && (
                <button
                  className="primary-button"
                  onClick={connectWallet}
                  disabled={isConnecting}
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
              {account && (
                <>
                  <button className="primary-button" disabled>
                    Connected: {shortenAddress(account)}
                  </button>
                  <button className="secondary-button" onClick={disconnectWallet}>
                    Disconnect
                  </button>
                </>
              )}
            </div>
            <p className="section-note">
              Connect to submit your best score onchain after the round ends.
            </p>
            {account && !isOnSupportedChain && (
              <button className="secondary-button" onClick={switchToSupportedChain}>
                Switch to {supportedChain.name}
              </button>
            )}
            {txStatus === 'success' && (
              <p className="success-text">Score submitted successfully onchain.</p>
            )}
            {txError && <p className="error-text">{txError}</p>}
          </div>

          <div className="card player-card">
            <p className="card-tag">Your Stats</p>
            <h3>Best run</h3>
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

          <div className="card leaderboard-card">
            <div className="panel-header compact">
              <div>
                <p className="card-tag">Leaderboard</p>
                <h3>Top scores</h3>
              </div>
              <button
                className="ghost-button"
                onClick={() => setRefreshTick((value) => value + 1)}
              >
                Refresh
              </button>
            </div>

            {loadingBoard && <p>Loading leaderboard...</p>}
            {boardError && <p className="error-text">{boardError}</p>}
            {!loadingBoard && !boardError && leaderboard.length === 0 && (
              <p>
                No onchain scores yet. Deploy the contract, set the env vars, and claim
                the first spot.
              </p>
            )}

            <div className="leaderboard-list">
              {leaderboard.map((entry, index) => (
                <div className="leaderboard-row" key={entry.address}>
                  <div>
                    <span className="rank">#{index + 1}</span>
                    <strong>{shortenAddress(entry.address)}</strong>
                  </div>
                  <div className="leaderboard-score">
                    <span>{entry.totalGames} games</span>
                    <strong>{entry.bestScore}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default App
