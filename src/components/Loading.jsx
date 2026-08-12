import { useEffect, useState } from 'react'
import { debugLog } from '../lib/debug'
import './Loading.css'

export default function Loading({
    text = 'Loading',
    inline = false
}) {
    debugLog('Loading component:', text, window.location.pathname)

    const [dots, setDots] = useState('')

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((current) => {
                if (current === '...') {
                    return ''
                }

                return current + '.'
            })
        }, 500)

        return () => clearInterval(interval)
    }, [])

    if (inline) {
        return <span>{text}{dots}</span>
    }

return (
    <div className="loading-container">
        <p>{text}{dots}</p>
    </div>
)
}