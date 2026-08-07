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

                // console.log('Current user ID:', user.id)

                const { data, error } = await supabase
                    .from('user_books')
                    .select(`
                    book:books(*)
                `)
                    .eq('user_id', user.id)

                if (error) {
                    throw error
                }

                // console.log('user_books data:', data)
                // console.log('user_books error:', error)

                const ownedBooks = data
                    .map((item) => item.book)
                    .filter(Boolean)

                const latestBooks = Object.values(
                    ownedBooks.reduce((acc, book) => {
                        const existing = acc[book.title]

                        if (!existing || book.volume > existing.volume) {
                            acc[book.title] = book
                        }

                        return acc
                    }, {})
                )

                setBooks(latestBooks)

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
                            <div key={book.id} className="book-card">
                                <h2>{book.title}</h2>
                                <p>Latest Volume: {book.volume}</p>
                                <p>Author: {book.author || 'Unknown'}</p>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </>
    )
}
