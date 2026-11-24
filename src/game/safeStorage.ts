// Keep a coherent session save if storage is blocked, full, or unavailable.
const session = new Map<string, string>()
let persistent = true
export const safeStorage = {
  getItem(key: string): string | null {
    if (session.has(key)) return session.get(key)!
    try { return localStorage.getItem(key) } catch { persistent = false; return null }
  },
  setItem(key: string, value: string) {
    session.set(key, value)
    try { localStorage.setItem(key, value) } catch { persistent = false }
  },
  isPersistent() {
    try {
      const key = 'pandajump.storage-check'
      localStorage.setItem(key, '1')
      localStorage.removeItem(key)
    } catch { persistent = false }
    return persistent
  },
}
