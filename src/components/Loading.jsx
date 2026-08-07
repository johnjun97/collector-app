import { useEffect, useState } from 'react'
import './Loading.css'

export default function Loading({ text = 'Loading' }) {
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

    return (
        <div className="loading-container">
            <p>{text}{dots}</p>
        </div>
    )
}