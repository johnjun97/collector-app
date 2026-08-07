import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { debugError } from '../../../lib/debug'
import Navbar from '../../../components/Navbar'
import './EditBook.css'
import Loading from '../../../components/Loading.jsx'
import BookForm from './BookForm'


export default function EditBook() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [book, setBook] = useState(null)
    const [volumes, setVolumes] = useState([])
    const [userBook, setUserBook] = useState(null)
    const [ownsBook, setOwnsBook] = useState(false)
    const [purchasedDate, setPurchasedDate] = useState('')
    const [purchasedPrice, setPurchasedPrice] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userBookLoading, setUserBookLoading] = useState(false)

    useEffect(() => {
        const getBook = async () => {
            try {
                const { data: currentBook, error: currentBookError } = await supabase
                    .from('books')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (currentBookError) {
                    throw currentBookError
                }

                setBook(currentBook)
                await getUserBook(currentBook.id)

                const { data: allVolumes, error: volumesError } = await supabase
                    .from('books')
                    .select('*')
                    .eq('title', currentBook.title)

                if (volumesError) {
                    throw volumesError
                }

                const sortedVolumes = [...allVolumes].sort(
                    (a, b) => Number(a.volume) - Number(b.volume)
                )

                setVolumes(sortedVolumes)

            } catch (error) {
                debugError('Error loading book:', error)
            } finally {
                setLoading(false)
            }
        }

        getBook()
    }, [id])

    const getUserBook = async (bookId) => {
        setUserBookLoading(true)

        try {
            const {
                data: { user },
                error: userError
            } = await supabase.auth.getUser()

            if (userError) {
                throw userError
            }

            if (!user) {
                setUserBook(null)
                setOwnsBook(false)
                setPurchasedDate('')
                setPurchasedPrice('')
                return
            }

            const { data, error } = await supabase
                .from('user_books')
                .select('*')
                .eq('user_id', user.id)
                .eq('book_id', bookId)
                .maybeSingle()

            if (error) {
                throw error
            }

            setUserBook(data)
            setOwnsBook(!!data)
            setPurchasedDate(data?.purchased_date || '')
            setPurchasedPrice(data?.purchased_price || '')

        } catch (error) {
            debugError('Error loading user book:', error)
        } finally {
            setUserBookLoading(false)
        }
    }

    const handleChange = (e) => {
        setBook({
            ...book,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!book.title.trim()) {
            alert('请输入书名')
            return
        }

        setSaving(true)

        try {
            const { error } = await supabase
                .from('books')
                .update({
                    subcategory: book.subcategory,
                    title: book.title.trim(),
                    author: book.author || null,
                    publisher: book.publisher || null,
                    volume: book.volume || null,
                    isbn: book.isbn || null,
                    release_date: book.release_date || null,
                })
                .eq('id', id)

            if (error) {
                throw error
            }

            navigate('/books')

        } catch (error) {
            debugError('Error updating book:', error)
            alert(error.message || '保存失败，请稍后再试')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <Loading text="正在加载" />
    }

    if (!book) {
        return <p>Book not found.</p>
    }

    return (
        <>
            <Navbar section="书籍" />

            <main className="edit-book-page">

                <div className="edit-book-header">
                    <div>
                        <h1>{book.title} - 第{book.volume}集</h1>
                    </div>

                    <button
                        type="button"
                        className="back-button"
                        onClick={() => navigate('/books')}
                    >
                        返回
                    </button>
                </div>

                <BookForm
                    book={book}
                    userBookLoading={userBookLoading}
                    volumes={volumes}
                    ownsBook={ownsBook}
                    setOwnsBook={setOwnsBook}
                    purchasedDate={purchasedDate}
                    setPurchasedDate={setPurchasedDate}
                    purchasedPrice={purchasedPrice}
                    setPurchasedPrice={setPurchasedPrice}
                    saving={saving}
                    handleChange={handleChange}
                    handleSubmit={handleSubmit}
                    setBook={setBook}
                    getUserBook={getUserBook}
                    navigate={navigate}
                />

            </main>
        </>
    )
}