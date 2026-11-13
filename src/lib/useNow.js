import { useSyncExternalStore } from 'react'

const TICK_MS = 30000
let current = Date.now()
let timer = null
const listeners = new Set()

function tick() {
  current = Date.now()
  listeners.forEach((listener) => listener())
}

function subscribe(listener) {
  current = Date.now()
  listeners.add(listener)
  if (!timer) {
    timer = setInterval(tick, TICK_MS)
  }
  return () => {
    listeners.delete(listener)
    if (!listeners.size && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

function getSnapshot() {
  return current
}

export function useNow() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
