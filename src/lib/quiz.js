// Quiz dataset loader + pool builder.
// Dataset is loaded from /dataset.json at runtime (not bundled) so the
// initial JS payload stays light. While loading we expose a Promise + flag.
import { formatChemString } from './chem'

let ALL_QUESTIONS = []
let ID_MAP = new Map()
let loaded = false
let loadingPromise = null

export function isDatasetLoaded() {
  return loaded
}

async function fetchWithRetry(url, attempts = 3) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 15000)
      const r = await fetch(url, { signal: ctrl.signal })
      clearTimeout(t)
      if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`)
      return await r.json()
    } catch (e) {
      lastErr = e
      // Exponential backoff: 200ms, 600ms, 1200ms
      if (i < attempts - 1) {
        await new Promise((res) => setTimeout(res, 200 * Math.pow(3, i)))
      }
    }
  }
  throw new Error(`Could not load dataset (${lastErr?.message || 'unknown error'})`)
}

export function loadDataset() {
  if (loadingPromise) return loadingPromise
  loadingPromise = fetchWithRetry(import.meta.env.BASE_URL + 'dataset.json')
    .then((data) => {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Dataset is empty or malformed')
      }
      // Pre-normalize lower-cased search blob.
      for (const q of data) {
        q._search = (
          q.question + '\n' +
          q.answer_text + '\n' +
          q.options.map((o) => o.text).join('\n') + '\n' +
          q.rationale
        ).toLowerCase()
      }
      ALL_QUESTIONS = data
      ID_MAP = new Map(data.map((q) => [q.id, q]))
      loaded = true
      return data
    })
    .catch((err) => {
      // Reset so the next call can retry.
      loadingPromise = null
      throw err
    })
  return loadingPromise
}

export function getAllQuestions() {
  return ALL_QUESTIONS
}

export function getCategoryCounts() {
  let ce = 0, sbe = 0
  for (const q of ALL_QUESTIONS) {
    if (q.category === 'CE') ce++
    else if (q.category === 'SBE') sbe++
  }
  return { ce, sbe, total: ALL_QUESTIONS.length }
}

export function questionsByCategory(category) {
  return ALL_QUESTIONS.filter((q) => q.category === category)
}

function seedFromString(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  }
  return h >>> 0
}

function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(arr, seedStr) {
  const rng = mulberry32(seedFromString(seedStr))
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function buildPool(mode, seedStr) {
  const seed = `${seedStr || 'default'}:${mode}`
  if (mode.endsWith('-ce')) {
    return shuffle(questionsByCategory('CE'), seed).map((q) => q.id)
  }
  if (mode.endsWith('-sbe')) {
    return shuffle(questionsByCategory('SBE'), seed).map((q) => q.id)
  }
  if (mode.endsWith('-both')) {
    const ce = shuffle(questionsByCategory('CE'), seed + ':ce')
    const sbe = shuffle(questionsByCategory('SBE'), seed + ':sbe')
    const rng = mulberry32(seedFromString(seed + ':mix'))
    const result = []
    let i = 0, j = 0
    while (i < ce.length || j < sbe.length) {
      const pickSBE = (i >= ce.length) ? true : (j >= sbe.length) ? false : rng() < 0.5
      if (pickSBE) {
        result.push(sbe[j].id); j++
      } else {
        result.push(ce[i].id); i++
      }
    }
    return result
  }
  return []
}

export function getById(id) {
  return ID_MAP.get(id)
}

export function modeLabel(mode) {
  if (mode.endsWith('-ce')) return 'CE'
  if (mode.endsWith('-sbe')) return 'SBE'
  if (mode.endsWith('-both')) return 'CE + SBE'
  return mode
}

export function isReviewMode(mode) {
  return mode.startsWith('review-')
}

export { formatChemString }
