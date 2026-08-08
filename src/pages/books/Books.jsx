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
                    book:books (
                        *,
                        series:book_series (*)
                    )
                `)
                    .eq('user_id', user.id)

                if (userBooksError) {
                    throw userBooksError
                }

                const ownedBooks = userBooks
                    .map((item) => item.book)
                    .filter(Boolean)

                if (ownedBooks.length === 0) {
                    setBooks([])
                    return
                }

                // Get unique series IDs
                const seriesIds = [
                    ...new Set(
                        ownedBooks
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

                    const ownedSeriesBooks = ownedBooks.filter(
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

                    const ownedVolumes = ownedSeriesBooks.map(
                        (book) => String(book.volume)
                    )

                    // Latest volume actually owned
                    const latestOwnedBook =
                        [...ownedSeriesBooks].sort((a, b) => {
                            const aNum = Number(a.volume)
                            const bNum = Number(b.volume)

                            if (!isNaN(aNum) && !isNaN(bNum)) {
                                return bNum - aNum
                            }

                            if (!isNaN(aNum)) return -1
                            if (!isNaN(bNum)) return 1

                            return String(b.volume).localeCompare(
                                String(a.volume)
                            )
                        })[0]

                    return {
                        id: series.id,
                        title: series.title,
                        author: series.author,
                        subcategory: series.subcategory,
                        cover_image: series.cover_image,
                        cover_image_url: series.cover_image_url,
                        allVolumes: sortedVolumes,
                        ownedVolumes,
                        latestOwnedBook
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
                                    if (book.latestOwnedBook) {
                                        navigate(`/books/${book.latestOwnedBook.id}/edit`)
                                    }
                                }}
                            >

                                <h2>{book.title}</h2>

                                <div className="volume-indicators">

                                    {book.allVolumes
                                        .sort((a, b) => {

                                            const aNum = Number(a.volume)
                                            const bNum = Number(b.volume)

                                            if (!isNaN(aNum) && !isNaN(bNum)) {
                                                return aNum - bNum
                                            }

                                            if (!isNaN(aNum)) return -1
                                            if (!isNaN(bNum)) return 1

                                            return String(a.volume)
                                                .localeCompare(
                                                    String(b.volume)
                                                )
                                        })
                                        .map((volume) => {

                                            const volumeValue =
                                                String(volume.volume)

                                            const owned =
                                                book.ownedVolumes.includes(
                                                    volumeValue
                                                )

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