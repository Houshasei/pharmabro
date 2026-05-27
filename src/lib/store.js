// Persistent state via zustand + localStorage.
// Holds player profile, per-mode quiz session, score, answered questions.
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      player: null, // { name: string, createdAt: number }
      setPlayer: (name) => set({ player: { name, createdAt: Date.now() } }),
      clearPlayer: () => set({ player: null }),

      // Sessions keyed by mode (e.g. 'quiz-ce', 'quiz-sbe', 'quiz-both', 'review-ce', ...)
      sessions: {},

      getSession: (mode) => get().sessions[mode] || null,

      initSession: (mode, questionIds) => {
        const sessions = { ...get().sessions }
        sessions[mode] = {
          mode,
          questionIds, // ordered list of question ids
          index: 0,
          score: 0,
          answers: {}, // questionId -> { picked: 'A', correct: true }
          startedAt: Date.now(),
          finishedAt: null,
        }
        set({ sessions })
      },

      answerCurrent: (mode, questionId, picked, correct) => {
        const sessions = { ...get().sessions }
        const s = sessions[mode]
        if (!s) return
        if (s.answers[questionId]) return // already answered
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

      jumpTo: (mode, idx) => {
        const sessions = { ...get().sessions }
        const s = sessions[mode]
        if (!s) return
        s.index = Math.max(0, Math.min(idx, s.questionIds.length - 1))
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
      name: 'pharmaquiz-state-v1',
      version: 1,
      storage: createJSONStorage(() => {
        // Wrap localStorage so quota errors don't crash the app.
        try {
          // Some browsers (Safari Private mode) throw on first write.
          localStorage.setItem('__pq_probe', '1')
          localStorage.removeItem('__pq_probe')
          return localStorage
        } catch {
          // Fallback: in-memory only (session not persisted).
          const mem = new Map()
          return {
            getItem: (k) => mem.get(k) ?? null,
            setItem: (k, v) => { mem.set(k, v) },
            removeItem: (k) => { mem.delete(k) },
          }
        }
      }),
      partialize: (s) => ({ player: s.player, sessions: s.sessions }),
      migrate: (persisted, fromVersion) => {
        // Future-proofing: if schema changes, drop incompatible sessions.
        if (!persisted || fromVersion < 1) {
          return { player: null, sessions: {} }
        }
        return persisted
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          // Corrupted JSON — clear and start fresh.
          try { localStorage.removeItem('pharmaquiz-state-v1') } catch {}
        }
      },
    }
  )
)
