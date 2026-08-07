const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true'

export function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log(...args)
  }
}

export function debugError(...args) {
  if (DEBUG_MODE) {
    console.error(...args)
  }
}