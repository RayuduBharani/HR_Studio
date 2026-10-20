/** Best-effort localStorage list persistence (drafts only live in this browser). */
export function loadList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

export function saveList<T>(key: string, items: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch {
    // storage full or unavailable — saving is best-effort
  }
}
