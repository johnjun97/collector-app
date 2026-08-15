const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true'

export const debugLog = (...args) => {
    if (DEBUG_MODE) {
        console.log(...args)
    }
}

export const debugWarn = (...args) => {
    if (DEBUG_MODE) {
        console.warn(...args)
    }
}

export const debugError = (...args) => {
    if (DEBUG_MODE) {
        console.error(...args)
    }
}

// use this to import 
// import { debugLog, debugError } from '../../../lib/debug'