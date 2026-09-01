import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import './BookCard.css'

export default function BookCard({
    book,
    onRemove,
    expandAll
}) {

    const navigate = useNavigate()
    const [expanded, setExpanded] = useState(expandAll)
    const [coverIndex, setCoverIndex] = useState(0)
    const [coverDirection, setCoverDirection] = useState('next')
    const [touchStartX, setTouchStartX] = useState(null)
    const [animateCover, setAnimateCover] = useState(false)

    useEffect(() => {
        setExpanded(expandAll)
    }, [expandAll])

    const sortedVolumes = [...book.allVolumes].sort((a, b) => {
        const aNum = Number(a.volume)
        const bNum = Number(b.volume)

        if (!isNaN(aNum) && !isNaN(bNum)) {
            if (aNum !== bNum) {
                return aNum - bNum
            }

            const aIsNormal =
                !a.edition || a.edition === '普通版'

            const bIsNormal =
                !b.edition || b.edition === '普通版'

            if (aIsNormal && !bIsNormal) return -1
            if (!aIsNormal && bIsNormal) return 1

            return String(a.edition || '')
                .localeCompare(String(b.edition || ''))
        }

        if (!isNaN(aNum)) return -1
        if (!isNaN(bNum)) return 1

        return String(a.volume).localeCompare(
            String(b.volume)
        )
    })

    const coverVolumes = [...book.allVolumes]
        .filter(
            (volume) =>
                volume.cover_image ||
                volume.cover_image_url
        )
        .sort((a, b) => {
            const aNum = Number(a.volume)
            const bNum = Number(b.volume)

            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum
            }

            if (!isNaN(aNum)) return -1
            if (!isNaN(bNum)) return 1

            return String(a.volume).localeCompare(
                String(b.volume)
            )
        })

    const [loadedCoverUrls, setLoadedCoverUrls] = useState(new Set())

    useEffect(() => {
        const latestOwnedCoverIndex = coverVolumes
            .map((volume, index) => ({
                volume,
                index
            }))
            .filter(({ volume }) =>
                book.ownedBookIds.has(volume.id)
            )
            .at(-1)?.index

        if (latestOwnedCoverIndex !== undefined) {
            setCoverIndex(latestOwnedCoverIndex)
        }
    }, [book.allVolumes])

    const coverVolume = coverVolumes[coverIndex]

    const coverUrl = coverVolume?.cover_image
        ? supabase.storage
            .from('book-covers')
            .getPublicUrl(coverVolume.cover_image)
            .data.publicUrl
        : coverVolume?.cover_image_url || null

    const navigateCover = (newIndex, direction) => {
        const targetVolume = coverVolumes[newIndex]

        if (!targetVolume) return

        const targetUrl = targetVolume.cover_image
            ? supabase.storage
                .from('book-covers')
                .getPublicUrl(targetVolume.cover_image)
                .data.publicUrl
            : targetVolume.cover_image_url

        setAnimateCover(loadedCoverUrls.has(targetUrl))
        setCoverDirection(direction)
        setCoverIndex(newIndex)
    }

    useEffect(() => {
        const indexesToPreload = [
            coverIndex - 1,
            coverIndex + 1
        ]

        indexesToPreload.forEach((index) => {
            const volume = coverVolumes[index]

            if (!volume) return

            const url = volume.cover_image
                ? supabase.storage
                    .from('book-covers')
                    .getPublicUrl(volume.cover_image)
                    .data.publicUrl
                : volume.cover_image_url

            if (!url) return

            const img = new Image()

            img.onload = () => {
                setLoadedCoverUrls((current) => {
                    if (current.has(url)) return current

                    const next = new Set(current)
                    next.add(url)
                    return next
                })
            }

            img.src = url
        })
    }, [coverIndex, book.allVolumes])

    const handleTouchStart = (e) => {
        setTouchStartX(e.touches[0].clientX)
    }

    const handleTouchEnd = (e) => {
        if (touchStartX === null) return

        const touchEndX = e.changedTouches[0].clientX
        const distance = touchEndX - touchStartX

        const swipeThreshold = 50

        if (Math.abs(distance) >= swipeThreshold) {

            // Swipe left = next cover
            if (
                distance < 0 &&
                coverIndex < coverVolumes.length - 1
            ) {
                navigateCover(coverIndex + 1, 'next')
            }

            // Swipe right = previous cover
            if (
                distance > 0 &&
                coverIndex > 0
            ) {
                navigateCover(coverIndex - 1, 'prev')
            }
        }

        setTouchStartX(null)
    }

    return (
        <div
            className="book-card"
            onClick={() => setExpanded(!expanded)}
        >

            {expanded && coverUrl && (
                <div
                    className="book-card-cover-container"
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >

                    {coverVolumes.length > 1 && (
                        <button
                            type="button"
                            className="cover-nav-button cover-nav-prev"
                            disabled={coverIndex === 0}
                            onClick={() => {
                                if (coverIndex === 0) return

                                navigateCover(coverIndex - 1, 'prev')
                            }}
                        >
                            &lt;
                        </button>
                    )}

                    <img
                        className={`book-card-cover ${animateCover
                                ? `cover-slide-${coverDirection}`
                                : ''
                            }`}
                        src={coverUrl}
                        alt={`${book.title} 封面`}
                        onClick={() => {
                            if (coverVolume) {
                                navigate(
                                    `/books/${coverVolume.id}/edit`
                                )
                            }
                        }}
                    />

                    {coverVolumes.length > 1 && (
                        <button
                            type="button"
                            className="cover-nav-button cover-nav-next"
                            disabled={
                                coverIndex ===
                                coverVolumes.length - 1
                            }
                            onClick={() => {
                                if (
                                    coverIndex ===
                                    coverVolumes.length - 1
                                ) {
                                    return
                                }

                                navigateCover(coverIndex + 1, 'next')
                            }}
                        >
                            &gt;
                        </button>
                    )}

                </div>
            )}

            <div className="book-card-header">

                <div className="book-card-info">

                    <h2
                        className="book-card-title"
                        onClick={async (e) => {
                            e.stopPropagation()

                            try {
                                await navigator.clipboard.writeText(
                                    book.title
                                )

                                alert(`已复制：${book.title}`)
                            } catch (error) {
                                console.error(
                                    'Failed to copy title:',
                                    error
                                )
                            }
                        }}
                        title="点击复制书名"
                    >
                        {book.title}

                        <span className="book-card-expand-icon">
                            {expanded ? '▼' : '▶'}
                        </span>

                        {book.subcategory && (
                            <span className="book-subcategory">
                                [{book.subcategory}]
                            </span>
                        )}
                    </h2>

                    <p>
                        Author: {book.author || 'Unknown'}
                    </p>

                </div>

                <button
                    type="button"
                    className="remove-series-button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove(book)
                    }}
                >
                    移除
                </button>

            </div>

            {expanded && (
                <div className="volume-indicators">

                    {sortedVolumes.map((volume) => {

                        const volumeValue =
                            String(volume.volume)

                        const owned =
                            book.ownedBookIds.has(volume.id)

                        return (
                            <span
                                key={volume.id}
                                className={`volume-indicator ${owned ? 'owned' : ''
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation()

                                    if (!volume.isPlaceholder) {
                                        navigate(
                                            `/books/${volume.id}/edit`
                                        )
                                    }
                                }}
                            >
                                {volumeValue}

                                {volume.edition &&
                                    volume.edition !== '普通版' && (
                                        <span className="volume-edition">
                                            &nbsp;(
                                            {volume.edition}
                                            )
                                        </span>
                                    )}
                            </span>
                        )
                    })}

                </div>
            )}

        </div>
    )
}