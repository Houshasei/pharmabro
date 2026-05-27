import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import TopBar from '../components/TopBar'
import { buildPool, getById, modeLabel, isReviewMode } from '../lib/quiz'
import { formatChem } from '../lib/chem'
import { decorateRationale } from '../lib/bisaya'

export default function Quiz() {
  const { mode } = useParams()
  const navigate = useNavigate()
  const player = useStore((s) => s.player)
  const session = useStore((s) => s.sessions[mode])
  const initSession = useStore((s) => s.initSession)
  const answerCurrent = useStore((s) => s.answerCurrent)
  const nextQuestion = useStore((s) => s.nextQuestion)
  const prevQuestion = useStore((s) => s.prevQuestion)
  const resetSession = useStore((s) => s.resetSession)

  useEffect(() => {
    if (!player) {
      navigate('/')
      return
    }
    if (!session) {
      // Fresh seed every new session so reset shuffles the order.
      const seed = `${player.name}:${Date.now()}:${Math.random()}`
      const pool = buildPool(mode, seed)
      if (pool.length === 0) {
        navigate('/menu')
        return
      }
      initSession(mode, pool)
    }
  }, [mode, player, session, initSession, navigate])

  const review = isReviewMode(mode)
  const currentId = session?.questionIds[session.index]
  const q = currentId ? getById(currentId) : null
  const total = session?.questionIds.length || 0
  const answered = session ? Object.keys(session.answers).length : 0
  const finished = session && answered >= total && session.finishedAt
  const userAns = q && session ? session.answers[q.id] : null
  const progressPct = total ? ((session.index + 1) / total) * 100 : 0

  // useMemo must run unconditionally before any early return.
  const rationale = useMemo(() => q ? decorateRationale(q.rationale, q) : null, [q])

  if (!player || !session) {
    return (
      <div className="app-container">
        <TopBar />
        <div className="empty-state"><div className="spinner" /> Loading…</div>
      </div>
    )
  }

  const handlePick = (label) => {
    if (review || userAns) return
    const correct = label === q.answer
    answerCurrent(mode, q.id, label, correct)
  }

  const goNext = () => {
    if (session.index >= total - 1) {
      useStore.getState().finishSession(mode)
    } else {
      nextQuestion(mode)
    }
  }

  if (finished) {
    return (
      <div className="app-container">
        <TopBar score={session.score} totalAnswered={total} />
        <div className="results-card">
          <div className="pill review" style={{ margin: '0 auto' }}>Done</div>
          <h2 style={{ marginTop: 16 }}>{review ? 'Review finished' : 'Quiz finished'}</h2>
          <div className="score-display">{session.score} / {total}</div>
          <p style={{ color: 'var(--text-dim)' }}>
            {review
              ? 'All questions reviewed.'
              : `${((session.score / total) * 100).toFixed(1)}%`}
          </p>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={() => { resetSession(mode); navigate(0) }}>
              Restart ↻
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/menu')}>
              Menu
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!q) {
    return (
      <div className="app-container">
        <TopBar />
        <div className="empty-state">Question not found.</div>
      </div>
    )
  }

  const showAnswer = review || !!userAns

  return (
    <div className="app-container">
      <TopBar score={session.score} totalAnswered={answered} />
      <div className="quiz-shell">
        <div className="quiz-header">
          <div className="quiz-meta-pills">
            <span className={`pill ${q.category.toLowerCase()}`}>{q.category}</span>
            <span className="pill mod">{q.module}</span>
            {review && <span className="pill review">Review mode</span>}
            <span className="pill" style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-dim)',
              border: '1px solid var(--border)'
            }}>
              {modeLabel(mode)} · Q{session.index + 1}/{total}
            </span>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('/menu')}>
            ← Menu
          </button>
        </div>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="question-card" key={q.id}>
          <div className="question-num">Question {session.index + 1} of {total}</div>
          <div className="question-text">{formatChem(q.question)}</div>

          <div className="option-list">
            {q.options.map((opt) => {
              const isCorrect = opt.label === q.answer
              let cls = 'option-btn'
              if (review) {
                if (isCorrect) cls += ' review-correct'
              } else if (userAns) {
                if (userAns.picked === opt.label && opt.label === q.answer) cls += ' correct'
                else if (userAns.picked === opt.label) cls += ' wrong'
                else if (opt.label === q.answer) cls += ' correct'
              }
              return (
                <button
                  key={opt.label}
                  className={cls}
                  onClick={() => handlePick(opt.label)}
                  disabled={review || !!userAns}
                >
                  <span className="letter">{opt.label}</span>
                  <span>{formatChem(opt.text)}</span>
                </button>
              )
            })}
          </div>

          {showAnswer && (
            <div className="rationale-box">
              <div className="rationale-header">
                {review ? '💡 Answer' : (userAns?.correct ? '✓ Correct' : '✗ Wrong')}
              </div>
              <div className="rationale-body">
                <strong className="neon-text-green">{q.answer}.</strong>{' '}{formatChem(q.answer_text)}
                <div style={{ marginTop: 8 }}>{formatChem(rationale.main)}</div>
                <span className="bisaya">🟧 {rationale.bisaya}</span>
              </div>
            </div>
          )}
        </div>

        <div className="quiz-actions">
          <button className="btn btn-ghost"
                  disabled={session.index === 0}
                  onClick={() => prevQuestion(mode)}>
            ← Previous
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => {
              if (window.confirm('Reset this entire session? Your score will be lost.')) {
                resetSession(mode)
                navigate(0)
              }
            }}>↻ Reset</button>
            {!review && !userAns ? (
              <button className="btn btn-secondary" onClick={goNext}>Skip →</button>
            ) : (
              <button className="btn btn-primary" onClick={goNext}>
                {session.index >= total - 1 ? 'Finish' : 'Next'} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
