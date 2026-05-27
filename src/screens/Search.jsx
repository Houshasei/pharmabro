import { useMemo, useState, useDeferredValue, Fragment } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { getAllQuestions, formatChemString } from '../lib/quiz'
import { formatChem } from '../lib/chem'

// Highlight matches while preserving chemistry formatting.
function highlight(text, q) {
  const transformed = formatChemString(text)
  if (!q || q.length < 2) return formatChem(transformed)
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = transformed.split(re)
  return (
    <>
      {parts.map((p, i) =>
        re.test(p) && p.toLowerCase() === q.toLowerCase()
          ? <mark key={i}>{p}</mark>
          : <Fragment key={i}>{p}</Fragment>
      )}
    </>
  )
}

export default function Search() {
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query)
  const all = getAllQuestions()

  const results = useMemo(() => {
    const q = deferred.trim().toLowerCase()
    if (!q || q.length < 2) return []
    const matches = []
    for (const item of all) {
      if (item._search.includes(q)) {
        matches.push(item)
        if (matches.length >= 80) break
      }
    }
    return matches
  }, [deferred, all])

  return (
    <div className="app-container">
      <TopBar />
      <div className="search-shell">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 28 }} className="gradient-text-2">Search</h1>
          <Link to="/menu" className="btn btn-ghost" style={{ marginLeft: 'auto' }}>← Menu</Link>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: -8 }}>
          {all.length} questions.
        </p>
        <div className="search-bar">
          <input
            className="input-neon"
            placeholder="Search a word or term…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div className="search-stats">
          {deferred.trim().length < 2
            ? 'Type at least 2 characters'
            : `${results.length} result${results.length === 1 ? '' : 's'}${results.length >= 80 ? ' (first 80)' : ''}`}
        </div>
        <div className="result-list">
          {results.map((r) => (
            <div className="result-card" key={r.id}>
              <div className="q-meta">
                <span className={`pill ${r.category.toLowerCase()}`}>{r.category}</span>
                <span className="pill mod">{r.module}</span>
                <span className="pill" style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-dim)',
                  border: '1px solid var(--border)'
                }}>Q{r.number}</span>
              </div>
              <div className="q-text">{highlight(r.question, deferred)}</div>
              <div className="q-ans">
                <span className="lbl">{r.answer}</span>
                {highlight(r.answer_text, deferred)}
              </div>
              {r.rationale && (
                <div className="q-rat">
                  <strong style={{ color: 'var(--neon-cyan)' }}>Rationale: </strong>
                  {highlight(r.rationale, deferred)}
                </div>
              )}
            </div>
          ))}
          {deferred.trim().length >= 2 && results.length === 0 && (
            <div className="empty-state">No results for "{deferred}". Try a different term.</div>
          )}
        </div>
      </div>
    </div>
  )
}
