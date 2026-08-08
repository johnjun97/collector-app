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
    const [series, setSeries] = useState(null)
    const [volumes, setVolumes] = useState([])

    const [ownsBook, setOwnsBook] = useState(false)
    const [purchasedDate, setPurchasedDate] = useState('')
    const [purchasedPrice, setPurchasedPrice] = useState('')

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userBookLoading, setUserBookLoading] = useState(false)

    useEffect(() => {
        const getBook = async () => {
            try {
                // Get current book + series
                const {
                    data: currentBook,
                    error: currentBookError
                } = await supabase
                    .from('books')
                    .select(`
                        *,
                        series:book_series(*)
                    `)
                    .eq('id', id)
                    .single()

                if (currentBookError) {
                    throw currentBookError
                }

                setBook(currentBook)
                setSeries(currentBook.series)

                // Get all volumes in this series
                const {
                    data: allVolumes,
                    error: volumesError
                } = await supabase
                    .from('books')
                    .select('*')
                    .eq('series_id', currentBook.series_id)

                if (volumesError) {
                    throw volumesError
                }

                const sortedVolumes = [...allVolumes].sort(
                    (a, b) => {
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
                    }
                )

                setVolumes(sortedVolumes)

                await getUserBook(currentBook.id)

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
                setOwnsBook(false)
                setPurchasedDate('')
                setPurchasedPrice('')
                return
            }

            const {
                data,
                error
            } = await supabase
                .from('user_books')
                .select('*')
                .eq('user_id', user.id)
                .eq('book_id', bookId)
                .maybeSingle()

            if (error) {
                throw error
            }

            setOwnsBook(!!data)
            setPurchasedDate(data?.purchased_date || '')
            setPurchasedPrice(data?.purchased_price || '')

        } catch (error) {
            debugError('Error loading user book:', error)
        } finally {
            setUserBookLoading(false)
        }
    }

    const handleSeriesChange = (e) => {
        setSeries({
            ...series,
            [e.target.name]: e.target.value
        })
    }

    const handleBookChange = (e) => {
        setBook({
            ...book,
            [e.target.name]: e.target.value
        })
    }

    const handleVolumeChange = async (volume) => {
        setBook(volume)
        await getUserBook(volume.id)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!series.title.trim()) {
            alert('请输入书名')
            return
        }

        setSaving(true)

        try {
            // Update series information
            const {
                error: seriesError
            } = await supabase
                .from('book_series')
                .update({
                    title: series.title.trim(),
                    author: series.author || null,
                    subcategory: series.subcategory,
                    cover_image: series.cover_image || null,
                    cover_image_url: series.cover_image_url || null,
                })
                .eq('id', series.id)

            if (seriesError) {
                throw seriesError
            }

            // Update volume information
            const {
                error: bookError
            } = await supabase
                .from('books')
                .update({
                    volume: book.volume,
                    edition: book.edition || '普通版',
                    publisher: book.publisher || null,
                    isbn: book.isbn || null,
                    release_date: book.release_date || null,
                    cover_image: book.cover_image || null,
                    cover_image_url: book.cover_image_url || null,
                })
                .eq('id', book.id)

            if (bookError) {
                throw bookError
            }

            // Update ownership
            const {
                data: { user }
            } = await supabase.auth.getUser()

            if (!user) {
                throw new Error('User is not logged in')
            }

            if (ownsBook) {
                const { error: userBookError } = await supabase
                    .from('user_books')
                    .upsert(
                        {
                            user_id: user.id,
                            book_id: book.id,
                            purchased_date: purchasedDate || null,
                            purchased_price: purchasedPrice || null,
                        },
                        {
                            onConflict: 'user_id,book_id'
                        }
                    )

                if (userBookError) {
                    throw userBookError
                }

            } else {
                const { error: deleteUserBookError } = await supabase
                    .from('user_books')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('book_id', book.id)

                if (deleteUserBookError) {
                    throw deleteUserBookError
                }
            }

            navigate('/books')

        } catch (error) {
            debugError('Error saving book:', error)
            alert(error.message || '保存失败，请稍后再试')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <Loading text="正在加载" />
    }

    if (!book || !series) {
        return <p>Book not found.</p>
    }

    return (
        <>
            <Navbar section="书籍" />

            <main className="edit-book-page">

                <div className="edit-book-header">
                    <div>
                        <h1>
                            {series.title} - 第{book.volume}集
                        </h1>
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
                    series={series}
                    book={book}
                    volumes={volumes}
                    ownsBook={ownsBook}
                    setOwnsBook={setOwnsBook}
                    purchasedDate={purchasedDate}
                    setPurchasedDate={setPurchasedDate}
                    purchasedPrice={purchasedPrice}
                    setPurchasedPrice={setPurchasedPrice}
                    userBookLoading={userBookLoading}
                    saving={saving}
                    handleSeriesChange={handleSeriesChange}
                    handleBookChange={handleBookChange}
                    handleVolumeChange={handleVolumeChange}
                    handleSubmit={handleSubmit}
                    navigate={navigate}
                />

            </main>
        </>
    )
}