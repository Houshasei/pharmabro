// Persistent quiz state via zustand + localStorage.
// Holds player profile, per-mode session, score, answered questions.
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

function safeStorage() {
  try {
    localStorage.setItem('__pq_probe', '1')
    localStorage.removeItem('__pq_probe')
    return localStorage
  } catch {
    // Safari Private mode etc. — fall back to in-memory (not persisted).
    const mem = new Map()
    return {
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => { mem.set(k, v) },
      removeItem: (k) => { mem.delete(k) },
    }
  }
}

export const useStore = create(
  persist(
    (set, get) => ({
      player: null, // { name, createdAt }
      setPlayer: (name) => set({ player: { name, createdAt: Date.now() } }),
      clearPlayer: () => set({ player: null }),

      sessions: {}, // mode -> session

      initSession: (mode, questionIds) => {
        const sessions = { ...get().sessions }
        sessions[mode] = {
          mode, questionIds, index: 0, score: 0, answers: {},
          startedAt: Date.now(), finishedAt: null,
        }
        set({ sessions })
      },

      answerCurrent: (mode, questionId, picked, correct) => {
        const sessions = { ...get().sessions }
        const s = sessions[mode]
        if (!s || s.answers[questionId]) return
        s.answers[questionId] = { picked, correct }
        if (correct) s.score += 1
        sessions[mode] = { ...s }
        set({ sessions })
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
      },

      prevQuestion: (mode) => {
        const sessions = { ...get().sessions }
        const s = sessions[mode]
        if (!s) return
        s.index = Math.max(s.index - 1, 0)
        sessions[mode] = { ...s }
        set({ sessions })
      },

      finishSession: (mode) => {
        const sessions = { ...get().sessions }
        const s = sessions[mode]
        if (!s) return
        s.finishedAt = Date.now()
        sessions[mode] = { ...s }
        set({ sessions })
      },

      resetSession: (mode) => {
        const sessions = { ...get().sessions }
        delete sessions[mode]
        set({ sessions })
      },
    }),
    {
      name: 'pharmabro-state-v1',
      storage: createJSONStorage(safeStorage),
      partialize: (s) => ({ player: s.player, sessions: s.sessions }),
    }
  )
)
