import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import TopBar from '../components/TopBar'
import { getCategoryCounts } from '../lib/quiz'

function ModeCard({ badge, badgeKind, title, desc, meta, onClick }) {
  return (
    <div className="mode-card" onClick={onClick} role="button" tabIndex={0}
         onKeyDown={(e) => { if (e.key === 'Enter') onClick() }}>
      <span className={`badge ${badgeKind}`}>{badge}</span>
      <h3>{title}</h3>
      <div className="desc">{desc}</div>
      <div className="meta">
        {meta.map((m, i) => <span key={i}>{m}</span>)}
      </div>
    </div>
  )
}

export default function Menu() {
  const navigate = useNavigate()
  const sessions = useStore((s) => s.sessions)
  const { ce: ceCount, sbe: sbeCount, total: totalCount } = getCategoryCounts()

  const cont = (mode) => {
    const s = sessions[mode]
    if (s) {
      const answered = Object.keys(s.answers).length
      return `Resume · ${answered}/${s.questionIds.length} done`
    }
    return null
  }

  return (
    <div className="app-container">
      <TopBar />
      <div className="menu-hero">
        <h1>Pick a Mode</h1>
        <p>{totalCount} questions across SBE and CE.</p>
      </div>

      <div className="section-title">⚡ Quiz</div>
      <div className="mode-grid">
        <ModeCard
          badge="SBE" badgeKind="quiz"
          title="SBE Quiz"
          desc="Specialty Board Exam questions."
          meta={[`${sbeCount} questions`, cont('quiz-sbe') || 'New session']}
          onClick={() => navigate('/quiz/quiz-sbe')}
        />
        <ModeCard
          badge="CE" badgeKind="quiz"
          title="CE Quiz"
          desc="Comprehensive Exam questions."
          meta={[`${ceCount} questions`, cont('quiz-ce') || 'New session']}
          onClick={() => navigate('/quiz/quiz-ce')}
        />
        <ModeCard
          badge="Mix 50/50" badgeKind="both"
          title="CE + SBE Mix"
          desc="Both pools, mixed."
          meta={[`${ceCount + sbeCount} questions`, cont('quiz-both') || 'New session']}
          onClick={() => navigate('/quiz/quiz-both')}
        />
      </div>

      <div className="section-title">📖 Review <span style={{color:'var(--text-dim)', fontWeight:400, letterSpacing:0}}>(answers shown)</span></div>
      <div className="mode-grid">
        <ModeCard
          badge="SBE" badgeKind="review"
          title="SBE Review"
          desc="Answers shown with explanation."
          meta={[`${sbeCount} questions`, cont('review-sbe') || 'New session']}
          onClick={() => navigate('/quiz/review-sbe')}
        />
        <ModeCard
          badge="CE" badgeKind="review"
          title="CE Review"
          desc="Answers shown with explanation."
          meta={[`${ceCount} questions`, cont('review-ce') || 'New session']}
          onClick={() => navigate('/quiz/review-ce')}
        />
        <ModeCard
          badge="Mix" badgeKind="review"
          title="CE + SBE Review"
          desc="Both pools, with answers."
          meta={[`${ceCount + sbeCount} questions`, cont('review-both') || 'New session']}
          onClick={() => navigate('/quiz/review-both')}
        />
      </div>

      <div className="menu-tools">
        <div className="tool-card" onClick={() => navigate('/search')}>
          <div className="ico">🔎</div>
          <div>
            <div className="label">Search</div>
            <div className="small">Look up a question, answer, or term.</div>
          </div>
        </div>
        <div className="tool-card" onClick={() => navigate('/credits')}>
          <div className="ico">💜</div>
          <div>
            <div className="label">Credits</div>
            <div className="small">@qtkaybee</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 36, color: 'var(--text-dim)', fontSize: 12, textAlign: 'center' }}>
        Refresh anytime — your progress is saved.
      </div>
    </div>
  )
}
