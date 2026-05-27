// Backwards-compat shim — old code imports useStore from this file.
// Now that we have remote-backed auth/state, we just re-export the auth store
// which exposes the same fields (player, sessions, setPlayer, initSession, ...).
export { useAuth as useStore } from './auth'
