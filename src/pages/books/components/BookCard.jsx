import { useNavigate } from 'react-router-dom'
import './BookCard.css'

export default function BookCard({
    book,
    onRemove
}) {
    const navigate = useNavigate()

    return (
        <div
            className="book-card"
            onClick={() => {
                if (book.latestBook) {
                    navigate(`/books/${book.latestBook.id}/edit`)
                }
            }}
        >

            <div className="book-title-row">
                <h2>
                    {book.title}
                    {book.subcategory && (
                        <span className="book-subcategory">
                            [{book.subcategory}]
                        </span>
                    )}
                </h2>

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

            <div className="volume-indicators">

                {book.allVolumes
                    .sort((a, b) => {
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
                    .map((volume) => {

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

            <p>
                Author: {book.author || 'Unknown'}
            </p>

        </div>
    )
}