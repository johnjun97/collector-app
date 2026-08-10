import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { debugError } from '../../../lib/debug'
import Navbar from '../../../components/Navbar'
import BookForm from "./newBookForm"
import './NewBook.css'

export default function NewBook() {

    const navigate = useNavigate()

    const handleSubmit = async (form, ownsBook, parsedVolumes) => {

        try {
            const title = form.title.trim()

            if (!title) {
                throw new Error('请输入书名')
            }

            if (!parsedVolumes || parsedVolumes.length === 0) {
                throw new Error('请输入有效的集数，例如：1-5、8、11-13')
            }

            // 1. Find existing book series
            const subcategory = form.subcategory || '漫画'

            const { data: existingSeries, error: seriesFindError } =
                await supabase
                    .from('book_series')
                    .select('*')
                    .eq('title', title)
                    .eq('subcategory', subcategory)
                    .maybeSingle()

            if (seriesFindError) {
                throw seriesFindError
            }

            let coverPath = null

            if (form.cover) {
                const fileExt = form.cover.name.split('.').pop()
                const fileName = `${crypto.randomUUID()}.${fileExt}`

                const { error: uploadError } = await supabase
                    .storage
                    .from('book-covers')
                    .upload(fileName, form.cover)

                if (uploadError) {
                    throw uploadError
                }

                coverPath = fileName
            }

            let series

            // 2. Use existing series or create a new one
            if (existingSeries) {
                series = existingSeries
            } else {
                const { data: newSeries, error: seriesInsertError } =
                    await supabase
                        .from('book_series')
                        .insert({
                            title,
                            author: form.author.trim() || null,
                            subcategory: form.subcategory || '漫画',
                        })
                        .select()
                        .single()

                if (seriesInsertError) {
                    throw seriesInsertError
                }

                series = newSeries
            }

            // 3. Get current user
            const {
                data: { user },
                error: userError
            } = await supabase.auth.getUser()

            if (userError) {
                throw userError
            }

            if (!user) {
                throw new Error('User is not logged in')
            }

            // 4. Create / reuse each volume
            for (const volume of parsedVolumes) {

                const volumeValue = String(volume)
                const edition = form.edition || '普通版'

                const { data: existingBook, error: bookFindError } =
                    await supabase
                        .from('books')
                        .select('*')
                        .eq('series_id', series.id)
                        .eq('volume', volumeValue)
                        .eq('edition', edition)
                        .maybeSingle()

                if (bookFindError) {
                    throw bookFindError
                }

                let book

                if (existingBook) {
                    book = existingBook
                } else {
                    const { data: newBook, error: insertError } =
                        await supabase
                            .from('books')
                            .insert({
                                series_id: series.id,
                                volume: volumeValue,
                                edition,
                                publisher: form.publisher.trim() || null,
                                isbn: form.isbn.trim() || null,
                                release_date: form.releaseDate || null,
                                cover_url: coverPath,
                                created_by: user.id,
                            })
                            .select()
                            .single()

                    if (insertError) {
                        throw insertError
                    }

                    book = newBook
                }

                // 5. Add this volume to user's collection
                const { error: userBookError } =
                    await supabase
                        .from('user_books')
                        .upsert(
                            {
                                user_id: user.id,
                                book_id: book.id,
                                is_owned: ownsBook,
                                purchased_date: ownsBook
                                    ? form.purchasedDate || null
                                    : null,
                                purchased_price: ownsBook
                                    ? form.purchasedPrice || null
                                    : null,
                            },
                            {
                                onConflict: 'user_id,book_id'
                            }
                        )

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