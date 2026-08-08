import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { debugError } from '../../lib/debug'
import './Books.css'

export default function Books() {

    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()


    useEffect(() => {
        const getBooks = async () => {
            try {
                const {
                    data: { user },
                    error: userError
                } = await supabase.auth.getUser()

                if (userError) {
                    throw userError
                }

                if (!user) {
                    setBooks([])
                    return
                }

                // Get all books owned by current user,
                // together with their series information
                const { data: userBooks, error: userBooksError } = await supabase
                    .from('user_books')
                    .select(`
    is_owned,
    book:books (
        *,
        series:book_series (*)
    )
`)

                    .eq('user_id', user.id)

                if (userBooksError) {
                    throw userBooksError
                }

                const addedBooks = userBooks
                    .map((item) => ({
                        ...item.book,
                        isOwned: item.is_owned
                    }))
                    .filter(Boolean)

                if (addedBooks.length === 0) {
                    setBooks([])
                    return
                }

                // Get unique series IDs
                const seriesIds = [
                    ...new Set(
                        addedBooks
                            .map((book) => book.series_id)
                            .filter(Boolean)
                    )
                ]

                // Get ALL volumes belonging to those series
                const { data: allBooks, error: allBooksError } = await supabase
                    .from('books')
                    .select(`
                    *,
                    series:book_series (*)
                `)
                    .in('series_id', seriesIds)

                if (allBooksError) {
                    throw allBooksError
                }

                // Group books by series
                const booksBySeries = seriesIds.map((seriesId) => {
                    const seriesBooks = allBooks.filter(
                        (book) => book.series_id === seriesId
                    )

                    const addedSeriesBooks = addedBooks.filter(
                        (book) => book.series_id === seriesId
                    )

                    if (seriesBooks.length === 0) {
                        return null
                    }

                    const series = seriesBooks[0].series

                    // Sort volumes
                    const sortedVolumes = [...seriesBooks].sort((a, b) => {
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

                    const addedVolumes = addedSeriesBooks.map(
                        (book) => String(book.volume)
                    )

                    const ownedBookIds = new Set(
                        addedSeriesBooks
                            .filter((book) => book.isOwned)
                            .map((book) => book.id)
                    )

                    const visibleVolumes = sortedVolumes.filter((volume) => {
                        const isSpecialEdition =
                            volume.edition && volume.edition !== '普通版'

                        // 普通版：一直显示
                        if (!isSpecialEdition) {
                            return true
                        }

                        // 特装版：只有用户入手才显示
                        return ownedBookIds.has(volume.id)
                    })


                    const latestBook = sortedVolumes[sortedVolumes.length - 1]
                    return {
                        id: series.id,
                        title: series.title,
                        author: series.author,
                        subcategory: series.subcategory,
                        cover_image: series.cover_image,
                        cover_image_url: series.cover_image_url,
                        allVolumes: visibleVolumes,
                        ownedBookIds,
                        addedVolumes,
                        latestBook
                    }
                }).filter(Boolean)

                setBooks(booksBySeries)

            } catch (error) {
                debugError('Error loading books:', error)
            } finally {
                setLoading(false)
            }
        }

        getBooks()
    }, [])

    const handleRemoveSeries = async (book) => {
        const confirmed = window.confirm(
            `确定要移除「${book.title}」吗？\n\n移除后，入手状态也会一并移除。`
        )

        if (!confirmed) return

        try {
            const {
                data: { user },
                error: userError
            } = await supabase.auth.getUser()

            if (userError) throw userError
            if (!user) throw new Error('User is not logged in')

            const bookIds = book.allVolumes.map((volume) => volume.id)

            const { error } = await supabase
                .from('user_books')
                .delete()
                .eq('user_id', user.id)
                .in('book_id', bookIds)

            if (error) throw error

            // Remove the card immediately from the page
            setBooks((currentBooks) =>
                currentBooks.filter((item) => item.id !== book.id)
            )

        } catch (error) {
            debugError('Error removing series:', error)
            alert('移除失败，请稍后再试')
        }
    }


    return (
        <>
            <Navbar section="书籍" />

            <main className="books-page">

                <div className="books-header">

                    <h1>My Books</h1>

                    <button
                        className="add-book-button"
                        onClick={() => navigate('/books/new')}
                    >
                        + Add Book
                    </button>

                </div>

                {loading ? (
                    <p>Loading books...</p>
                ) : books.length === 0 ? (
                    <p>No books yet.</p>
                ) : (
                    <div className="books-list">

                        {books.map((book) => (

                            <div
                                key={book.id}
                                className="book-card"
                                onClick={() => {
                                    if (book.latestBook) {
                                        navigate(`/books/${book.latestBook.id}/edit`)
                                    }
                                }}
                            >

                                <div className="book-title-row">
                                    <h2>{book.title}</h2>

                                    <button
                                        type="button"
                                        className="remove-series-button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleRemoveSeries(book)
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

                                                // Same volume number:
                                                // 普通版 first, special editions after
                                                const aIsNormal = !a.edition || a.edition === '普通版'
                                                const bIsNormal = !b.edition || b.edition === '普通版'

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

                                            const volumeValue =
                                                String(volume.volume)

                                            const owned = book.ownedBookIds.has(volume.id)

                                            return (
                                                <span
                                                    key={volume.id}
                                                    className={`volume-indicator ${owned ? 'owned' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        navigate(`/books/${volume.id}/edit`)
                                                    }}
                                                >
                                                    {volumeValue}
                                                    {volume.edition && volume.edition !== '普通版' && (
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

                        ))}

                    </div>
                )}

            </main>
        </>
    )
}