import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { debugError } from '../../../lib/debug'
import Navbar from '../../../components/Navbar'
import './NewBook.css'

export default function NewBook() {

    const navigate = useNavigate()

    const [form, setForm] = useState({
        subcategory: '漫画',
        title: '',
        volume: '',
        edition: '',
        author: '',
        publisher: '',
        isbn: '',
        releaseDate: '',
        purchasedDate: '',
        purchasedPrice: '',
    })

    const [ownsBook, setOwnsBook] = useState(false)
    const [saving, setSaving] = useState(false)

    const handleChange = (e) => {
        const { id, value } = e.target

        setForm((prev) => ({
            ...prev,
            [id]: value,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.title.trim()) {
            alert('请输入书名')
            return
        }

        setSaving(true)

        try {
            let book

            // 1. Check whether this book already exists
            const { data: existingBook, error: findError } = await supabase
                .from('books')
                .select('*')
                .eq('title', form.title.trim())
                .eq('volume', form.volume || null)
                .maybeSingle()

            if (findError) {
                throw findError
            }

            // 2. Use existing book or create a new one
            if (existingBook) {
                book = existingBook
            } else {
                const { data: newBook, error: insertError } = await supabase
                    .from('books')
                    .insert({
                        title: form.title.trim(),
                        volume: form.volume || null,
                        author: form.author || null,
                        subcategory: form.subcategory,
                        edition: form.edition || null,
                        publisher: form.publisher || null,
                        isbn: form.isbn || null,
                        release_date: form.releaseDate || null,
                    })
                    .select()
                    .single()

                if (insertError) {
                    throw insertError
                }

                book = newBook
            }

            // 3. If the user owns the book, create user_books
            if (ownsBook) {
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    throw new Error('User is not logged in')
                }

                const { error: userBookError } = await supabase
                    .from('user_books')
                    .insert({
                        user_id: user.id,
                        book_id: book.id,
                        purchased_date: form.purchasedDate || null,
                        purchased_price: form.purchasedPrice || null,
                    })

                if (userBookError) {
                    throw userBookError
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

    return (

        <>
            <Navbar section="书籍" />

            <main className="new-book-page">
                <div className="new-book-header">
                    <h1>新增书籍</h1>

                    <button
                        type="button"
                        className="back-button"
                        onClick={() => navigate('/books')}
                    >
                        ← 返回
                    </button>
                </div>

                <div className="new-book-form-container">
                    <form className="new-book-form" onSubmit={handleSubmit}>

                        <div className="form-field">
                            <label htmlFor="subcategory">类型</label>
                            <select
                                id="subcategory"
                                value={form.subcategory}
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
                                type="text"
                                placeholder="请输入书名"
                                value={form.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="volume">集数</label>
                            <input
                                id="volume"
                                type="text"
                                placeholder="例如：1、2、3、全"
                                value={form.volume}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="edition">版本</label>
                            <input
                                id="edition"
                                type="text"
                                placeholder="例如：普通版、限定版、特装版"
                                value={form.edition}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="author">作者</label>
                            <input
                                id="author"
                                type="text"
                                placeholder="请输入作者"
                                value={form.author}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="publisher">出版社</label>
                            <input
                                id="publisher"
                                type="text"
                                placeholder="请输入出版社"
                                value={form.publisher}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="isbn">ISBN</label>
                            <input
                                id="isbn"
                                type="text"
                                placeholder="请输入 ISBN"
                                value={form.isbn}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="releaseDate">发售日期</label>
                            <input
                                id="releaseDate"
                                type="date"
                                value={form.releaseDate}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="purchasedDate">购买日期</label>
                            <input
                                id="purchasedDate"
                                type="date"
                                value={form.purchasedDate}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="purchasedPrice">购买价格</label>
                            <input
                                id="purchasedPrice"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="请输入购买价格"
                                value={form.purchasedPrice}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={ownsBook}
                                    onChange={(e) => setOwnsBook(e.target.checked)}
                                />
                                已入手
                            </label>
                        </div>

                        <div className="ownership-field">
                            <label htmlFor="cover">封面: </label>
                            <input
                                id="cover"
                                type="file"
                                accept="image/*"
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
                </div>
            </main>
        </>
    )
}