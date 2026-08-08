import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { debugError } from '../../lib/debug'
import BookCard from './components/BookCard'
import { buildBooksBySeries } from './utils/bookUtils'
import './Books.css'

export default function Books() {

    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [subcategoryFilter, setSubcategoryFilter] = useState('')

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
        updated_at,
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
                        isOwned: item.is_owned,
                        userBookUpdatedAt: item.updated_at
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

                const booksBySeries = buildBooksBySeries(
                    addedBooks,
                    allBooks,
                    seriesIds
                )

                setBooks(booksBySeries)

            } catch (error) {
                debugError('Error loading books:', error)
            } finally {
                setLoading(false)
            }
        }

        getBooks()
    }, [])

    const filteredBooks = books.filter((book) => {
        const keyword = search.trim().toLowerCase()

        const matchesSearch =
            !keyword ||
            [
                book.title,
                book.author,
                book.subcategory
            ].some((value) =>
                String(value || '')
                    .toLowerCase()
                    .includes(keyword)
            )

        const matchesSubcategory =
            !subcategoryFilter ||
            book.subcategory === subcategoryFilter

        return matchesSearch && matchesSubcategory
    })

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

                    <div className="books-header-actions">
                        <input
                            type="search"
                            className="books-search"
                            placeholder="搜索书名、作者..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <select
                            className="books-filter"
                            value={subcategoryFilter}
                            onChange={(e) => setSubcategoryFilter(e.target.value)}
                        >
                            <option value="">全部类型</option>
                            <option value="漫画">漫画</option>
                            <option value="小说">小说</option>
                            <option value="画集">画集</option>
                            <option value="设定集">设定集</option>
                            <option value="公式书">公式书</option>
                            <option value="同人志">同人志</option>
                            <option value="其他">其他</option>
                        </select>

                        <button
                            className="add-book-button"
                            onClick={() => navigate('/books/new')}
                        >
                            + Add Book
                        </button>
                    </div>

                </div>

                {loading ? (
                    <div className="books-loading">
                        Loading books...
                    </div>
                ) : filteredBooks.length === 0 ? (
                    <p>No matching books.</p>
                ) : (
                    <div className="books-list">

                        {filteredBooks.map((book) => (
                            <BookCard
                                key={book.id}
                                book={book}
                                onRemove={handleRemoveSeries}
                            />
                        ))}

                    </div>
                )}

            </main>
        </>
    )
}