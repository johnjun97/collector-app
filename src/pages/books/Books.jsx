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

                const { data: userBooks, error: userBooksError } = await supabase
                    .from('user_books')
                    .select(`
                book:books(*)
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

                const titles = [...new Set(
                    ownedBooks.map((book) => book.title)
                )]

                const { data: allBooks, error: allBooksError } = await supabase
                    .from('books')
                    .select('*')
                    .in('title', titles)

                if (allBooksError) {
                    throw allBooksError
                }

                const booksByTitle = titles.map((title) => {
                    const titleBooks = allBooks.filter(
                        (book) => book.title === title
                    )

                    const ownedVolumes = ownedBooks
                        .filter((book) => book.title === title)
                        .map((book) => String(book.volume))

                    return {
                        ...titleBooks[0],
                        allVolumes: titleBooks,
                        ownedVolumes
                    }
                })

                setBooks(booksByTitle)

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
                                onClick={() => navigate(`/books/${book.id}/edit`)}
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

                                            return String(a.volume).localeCompare(String(b.volume))
                                        })
                                        .map((volume) => {
                                            const volumeValue = String(volume.volume)
                                            const owned = book.ownedVolumes.includes(volumeValue)

                                            return (
                                                <span
                                                    key={volume.id}
                                                    className={`volume-indicator ${owned ? 'owned' : ''}`}
                                                >
                                                    {volumeValue}
                                                </span>
                                            )
                                        })}
                                </div>


                                <p>Author: {book.author || 'Unknown'}</p>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </>
    )
}
