import { useEffect, useRef, useState } from 'react'

export default function useMessage(duration = 5000) {
    const [message, setMessage] = useState('')
    const timerRef = useRef(null)

    const showMessage = (text) => {
        setMessage(text)

        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }

        timerRef.current = setTimeout(() => {
            setMessage('')
            timerRef.current = null
        }, duration)
    }

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }
    }, [])

    return [message, showMessage]
}