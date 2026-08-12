import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { debugError } from '../../../lib/debug'
import Navbar from '../../../components/Navbar'
import NewBookForm from './newBookForm'
import './NewBook.css'

export default function NewBook() {

    const navigate = useNavigate()

    const handleSubmit = async (form, ownsBook, parsedVolumes) => {

        console.log('handleSubmit called:', {
            form,
            ownsBook,
            parsedVolumes
        })

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

            // 4. Determine all volumes that should exist
//
// If the highest numeric volume is 3,
// automatically create 1, 2, 3.
//
// Text volumes such as "全", "上", "下" are kept as-is.
const numericVolumes = parsedVolumes.filter(
    volume => Number.isInteger(Number(volume)) && Number(volume) > 0
)

const highestVolume = numericVolumes.length
    ? Math.max(...numericVolumes.map(Number))
    : null

const allVolumes = new Set(parsedVolumes)

if (highestVolume !== null) {
    for (let i = 1; i <= highestVolume; i++) {
        allVolumes.add(i)
    }
}

// 5. Create / reuse each volume
for (const volume of allVolumes) {

    const volumeValue = String(volume)

    // Was this volume explicitly entered by the user?
    const isRequestedVolume = parsedVolumes.some(
        item => String(item) === volumeValue
    )

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

        // Only apply ISBN to the volume the user actually entered.
        //
        // Example:
        // User adds Volume 3 with ISBN 978xxxx
        //
        // Volume 1 -> no ISBN
        // Volume 2 -> no ISBN
        // Volume 3 -> 978xxxx
        const bookIsbn =
            isRequestedVolume
                ? form.isbn.trim() || null
                : null

        const { data: newBook, error: insertError } =
            await supabase
                .from('books')
                .insert({
                    series_id: series.id,
                    volume: volumeValue,
                    edition,
                    publisher: form.publisher.trim() || null,
                    isbn: bookIsbn,
                    release_date: isRequestedVolume
                        ? form.releaseDate || null
                        : null,
                    cover_image: coverPath,
                    cover_image_url: form.coverUrl.trim() || null,
                    created_by: user.id,
                })
                .select()
                .single()

        if (insertError) {
            throw insertError
        }

        book = newBook
    }

    // 6. Add this volume to user's collection
    //
    // Explicitly entered volume:
    //   use the checkbox value.
    //
    // Automatically-created previous volume:
    //   mark as not owned, BUT don't overwrite an existing
    //   user_books record.
    if (isRequestedVolume) {

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

    } else {

        // Automatically-created volume.
        //
        // If the user already has this book in user_books,
        // don't overwrite their existing ownership status.
        const { error: userBookError } =
            await supabase
                .from('user_books')
                .upsert(
                    {
                        user_id: user.id,
                        book_id: book.id,
                        is_owned: false,
                    },
                    {
                        onConflict: 'user_id,book_id',
                        ignoreDuplicates: true
                    }
                )

        if (userBookError) {
            throw userBookError
        }
    }
}

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

                    <NewBookForm
                        onSubmit={handleSubmit}
                        onCancel={() => navigate('/books')}
                    />

                </div>

            </main>
        </>
    )
}