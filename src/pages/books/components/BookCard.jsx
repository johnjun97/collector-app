import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import './BookCard.css'

export default function BookCard({
    book,
    onRemove,
    expandAll
}) {

const [copied, setCopied] = useState(false)
    const navigate = useNavigate()
    const [expanded, setExpanded] = useState(expandAll)
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

    const coverVolume = [...book.allVolumes]
        .filter((volume) => volume.cover_image)
        .sort((a, b) => {
            const aNum = Number(a.volume)
            const bNum = Number(b.volume)

            if (!isNaN(aNum) && !isNaN(bNum)) {
                return bNum - aNum
            }

            if (!isNaN(aNum)) return -1
            if (!isNaN(bNum)) return 1

            return String(b.volume).localeCompare(String(a.volume))
        })[0]

    const coverPath = coverVolume?.cover_image

    const coverUrl = coverPath
        ? supabase.storage
            .from('book-covers')
            .getPublicUrl(coverPath).data.publicUrl
        : null


    return (
        <div className="book-card">

            {expanded && coverUrl && (
                <img
                    className="book-card-cover"
                    src={coverUrl}
                    alt={`${book.title} 封面`}
                    onClick={() => {
                        if (coverVolume) {
                            navigate(`/books/${coverVolume.id}/edit`)
                        }
                    }}
                />
            )}

            <div
                className="book-card-header"
                onClick={() => setExpanded(!expanded)}
            >

                <div className="book-card-info">

                    <h2
                        className="book-card-title"
                        onClick={async (e) => {
                            e.stopPropagation()

                            try {
                                await navigator.clipboard.writeText(book.title)
                                alert('已复制书名')
                            } catch (error) {
                                console.error('Failed to copy title:', error)
                            }
                        }}
                        title="点击复制书名"
                    >
                        {book.title}

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
    <div
        className="volume-indicators"
        onClick={() => {
            if (coverVolume) {
                navigate(`/books/${coverVolume.id}/edit`)
            }
        }}
    >

                    {sortedVolumes.map((volume) => {

                        const volumeValue = String(volume.volume)

                        const owned =
                            book.ownedBookIds.has(volume.id)

                        return (
                            <span
                                key={volume.id}
                                className={`volume-indicator ${owned ? 'owned' : ''}`}
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
                                            &nbsp;({volume.edition})
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