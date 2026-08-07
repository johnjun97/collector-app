import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { debugError } from '../../../lib/debug'
import Navbar from '../../../components/Navbar'
import BookForm from "./BookForm";
import './NewBook.css'

export default function NewBook() {

    const navigate = useNavigate()

    const handleSubmit = async (form, ownsBook) => {

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

            throw error
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
                        返回
                    </button>
                </div>

                <div className="new-book-form-container">
                    <BookForm
                        onSubmit={handleSubmit}
                        onCancel={() => navigate('/books')}
                    />
                </div>
            </main>
        </>
    )
}