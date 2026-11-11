const TOKEN_KEY = 'joblens_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function api(path, options = {}) {
  const token = getToken()
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(path, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (res.status === 401) {
    setToken(null)
    window.dispatchEvent(new CustomEvent('joblens:unauthorized'))
    throw new Error(data.error || 'Unauthorized')
  }

  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function initials(name = '') {
  return name
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?'
}

export function avatarColors(seed = '') {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return {
    background: `linear-gradient(135deg, hsl(${hue} 70% 52%), hsl(${(hue + 55) % 360} 75% 42%))`,
  }
}
