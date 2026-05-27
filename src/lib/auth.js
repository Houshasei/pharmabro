// Auth + remote-sync store.
//
// Holds: {key, token, deviceId, status, lastError}
// Persists key+token+deviceId in localStorage so refresh keeps the session.
// Also re-exports the user-facing store-state (`player`, `sessions`) which is
// loaded from the server on auth and pushed back (debounced) when changed.

import { create } from 'zustand'
import { api } from './api'

const STORAGE_KEY = 'pharmabro-auth-v1'

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function persist(state) {
  try {
    if (!state) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

function generateDeviceId() {
  const buf = new Uint8Array(8)
  crypto.getRandomValues(buf)
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('')
}

const persisted = loadPersisted()

// Debounce save to server
let saveTimeout = null
let pendingSnapshot = null
function scheduleSave(getState) {
  if (saveTimeout) return
  saveTimeout = setTimeout(async () => {
    saveTimeout = null
    const { key, token, player, sessions } = getState()
    if (!key || !token) return
    pendingSnapshot = { player, sessions }
    const res = await api.saveProgress(key, token, pendingSnapshot)
    if (!res.ok && res.status === 401) {
      // Session lost
      useAuth.setState({ status: 'expired', lastError: res.error || 'Session expired' })
    }
  }, 600)
}

export const useAuth = create((set, get) => ({
  // Auth state
  key: persisted?.key || null,
  token: persisted?.token || null,
  deviceId: persisted?.deviceId || generateDeviceId(),
  status: persisted?.token ? 'rehydrating' : 'idle', // idle | rehydrating | logging-in | active | expired | error
  lastError: null,

  // User-facing state (synced from server)
  player: null,
  sessions: {},

  // ---- Auth actions ----

  login: async (rawKey) => {
    set({ status: 'logging-in', lastError: null })
    const res = await api.login(rawKey.trim(), get().deviceId)
    if (!res.ok) {
      set({ status: 'idle', lastError: res.error || 'Login failed' })
      return false
    }
    persist({ key: res.key, token: res.token, deviceId: get().deviceId })
    set({ key: res.key, token: res.token, status: 'active', lastError: null })
    // Load progress
    await get().refreshProgress()
    return true
  },

  logout: async () => {
    const { key, token } = get()
    if (key && token) {
      await api.logout(key, token).catch(() => {})
    }
    persist(null)
    set({
      key: null, token: null, status: 'idle',
      player: null, sessions: {}, lastError: null,
    })
  },

  refreshProgress: async () => {
    const { key, token } = get()
    if (!key || !token) return
    const res = await api.getProgress(key, token)
    if (!res.ok) {
      if (res.status === 401) {
        // Session was killed (another device logged in or token expired)
        set({ status: 'expired', lastError: res.error || 'Session expired' })
      }
      return
    }
    set({
      player: res.progress?.player ?? null,
      sessions: res.progress?.sessions ?? {},
    })
  },

  rehydrate: async () => {
    const { key, token } = get()
    if (!key || !token) {
      set({ status: 'idle' })
      return
    }
    set({ status: 'rehydrating' })
    const res = await api.heartbeat(key, token)
    if (!res.ok) {
      persist(null)
      set({ key: null, token: null, status: 'idle', lastError: res.error || 'Session expired' })
      return
    }
    set({ status: 'active' })
    await get().refreshProgress()
  },

  // ---- User state setters (mirror the previous store API) ----

  setPlayer: (name) => {
    set({ player: { name, createdAt: Date.now() } })
    scheduleSave(get)
  },

  initSession: (mode, questionIds) => {
    const sessions = { ...get().sessions }
    sessions[mode] = {
      mode, questionIds, index: 0, score: 0, answers: {},
      startedAt: Date.now(), finishedAt: null,
    }
    set({ sessions })
    scheduleSave(get)
  },

  answerCurrent: (mode, questionId, picked, correct) => {
    const sessions = { ...get().sessions }
    const s = sessions[mode]
    if (!s) return
    if (s.answers[questionId]) return
    s.answers[questionId] = { picked, correct }
    if (correct) s.score += 1
    sessions[mode] = { ...s }
    set({ sessions })
    scheduleSave(get)
  },

  nextQuestion: (mode) => {
    const sessions = { ...get().sessions }
    const s = sessions[mode]
    if (!s) return
    const max = s.questionIds.length - 1
    s.index = Math.min(s.index + 1, max)
    if (s.index >= max && Object.keys(s.answers).length >= s.questionIds.length) {
      s.finishedAt = Date.now()
    }
    sessions[mode] = { ...s }
    set({ sessions })
    scheduleSave(get)
  },

  prevQuestion: (mode) => {
    const sessions = { ...get().sessions }
    const s = sessions[mode]
    if (!s) return
    s.index = Math.max(s.index - 1, 0)
    sessions[mode] = { ...s }
    set({ sessions })
    scheduleSave(get)
  },

  finishSession: (mode) => {
    const sessions = { ...get().sessions }
    const s = sessions[mode]
    if (!s) return
    s.finishedAt = Date.now()
    sessions[mode] = { ...s }
    set({ sessions })
    scheduleSave(get)
  },

  resetSession: (mode) => {
    const sessions = { ...get().sessions }
    delete sessions[mode]
    set({ sessions })
    scheduleSave(get)
  },
}))

// Compat: existing code imports useStore from './store'. Re-export a shim
// pointing at the same fields. (See store.js wrapper.)
