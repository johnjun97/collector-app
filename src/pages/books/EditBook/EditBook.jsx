import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { debugError } from '../../../lib/debug'
import Navbar from '../../../components/Navbar'
import './EditBook.css'
import Loading from '../../../components/Loading.jsx'


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
                        <h1>{book.title} - 第 {book.volume} 集</h1>
                    </div>

                    <button
                        type="button"
                        className="back-button"
                        onClick={() => navigate('/books')}
                    >
                        返回
                    </button>
                </div>

                <form className="edit-book-form" onSubmit={handleSubmit}>

                    <div className="form-field">
                        <label htmlFor="subcategory">类型</label>

                        <select
                            id="subcategory"
                            name="subcategory"
                            value={book.subcategory || '漫画'}
                            onChange={handleChange}
                        >
                            <option value="漫画">漫画</option>
                            <option value="小说">小说</option>
                            <option value="画集">画集</option>
                            <option value="设定集">设定集</option>
                            <option value="公式书">公式书</option>
                            <option value="同人志">同人志</option>
                            <option value="其他">其他</option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label htmlFor="title">书名</label>

                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={book.title || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="author">作者</label>

                        <input
                            id="author"
                            name="author"
                            type="text"
                            value={book.author || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="publisher">出版社</label>

                        <input
                            id="publisher"
                            name="publisher"
                            type="text"
                            value={book.publisher || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-field">
                        <label>集数</label>

                        <div className="volume-buttons">
                            {volumes.map((volume) => (
                                <button
                                    key={volume.id}
                                    type="button"
                                    onClick={() => {
                                        setBook(volume)
                                        getUserBook(volume.id)
                                    }}
                                >
                                    {volume.volume}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-field">
                        <label>
                            <input
                                type="checkbox"
                                checked={ownsBook}
                                onChange={(e) => setOwnsBook(e.target.checked)}
                            />
                            入手
                        </label>
                    </div>

                    {ownsBook && (
                        <>
                            <div className="form-field">
                                <label htmlFor="purchasedDate">购买日期</label>

                                <input
                                    id="purchasedDate"
                                    type="date"
                                    value={purchasedDate}
                                    onChange={(e) => setPurchasedDate(e.target.value)}
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="purchasedPrice">购买价格</label>

                                <input
                                    id="purchasedPrice"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={purchasedPrice}
                                    onChange={(e) => setPurchasedPrice(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <div className="form-field">
                        <label htmlFor="isbn">ISBN</label>

                        <input
                            id="isbn"
                            name="isbn"
                            type="text"
                            value={book.isbn || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="release_date">发售日期</label>

                        <input
                            id="release_date"
                            name="release_date"
                            type="date"
                            value={book.release_date || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-actions">

                        <button
                            type="button"
                            onClick={() => navigate('/books')}
                        >
                            取消
                        </button>

                        <button type="submit" disabled={saving}>
                            {saving ? '保存中...' : '保存'}
                        </button>

                    </div>

                </form>

            </main>
        </>
    )
}