import { useEffect, useState } from 'react'
import './Loading.css'

export default function Loading({ text = 'Loading' }) {
    console.log('Loading component:', text, window.location.pathname)

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
        <div
            className="loading-container"
            style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <p>{text}{dots}</p>
        </div>
    )
}