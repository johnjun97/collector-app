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
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .order('title')

            if (error) {
                debugError('Error loading books:', error)
                return
            }

            const latestBooks = Object.values(
                data.reduce((acc, book) => {
                    const existing = acc[book.title]

                    if (!existing || book.volume > existing.volume) {
                        acc[book.title] = book
                    }

                    return acc
                }, {})
            )

            setBooks(latestBooks)
            setLoading(false)
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
