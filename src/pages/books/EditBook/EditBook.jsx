import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { debugError } from '../../../lib/debug'
import Navbar from '../../../components/Navbar'
import './EditBook.css'
import Loading from '../../../components/Loading.jsx'
import EditBookForm from './EditBookForm/EditBookForm.jsx'

export default function EditBook() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [book, setBook] = useState(null)
    const [series, setSeries] = useState(null)
    const [updatedByUser, setUpdatedByUser] = useState(null)
    const [coverUpdatedByUser, setCoverUpdatedByUser] = useState(null)
    const [volumes, setVolumes] = useState([])
    const [batchVolumes, setBatchVolumes] = useState('')
    const [batchOwnership, setBatchOwnership] = useState({})
    const [cover, setCover] = useState(null)
    const [removeCover, setRemoveCover] = useState(false)
    const [ownsBook, setOwnsBook] = useState(false)
    const [purchasedDate, setPurchasedDate] = useState('')
    const [purchasedPrice, setPurchasedPrice] = useState('')
    const [publisherName, setPublisherName] = useState('')

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userBookLoading, setUserBookLoading] = useState(false)

    useEffect(() => {
        const getBook = async () => {
            debugLog('EditBook getBook started, id:', id)
            try {

                // Get current book + series
                const response = await supabase
                    .from('books')
                    .select(`
        *,
        series:book_series(*),
        publisher:publishers(*)
    `)
                    .eq('id', id)
                    .single()

                debugLog('EditBook Supabase response:', response)

                const currentBook = response.data
                const currentBookError = response.error

                debugLog('EditBook currentBook:', currentBook)
                debugLog('EditBook currentBookError:', currentBookError)

                if (currentBookError) {
                    throw currentBookError
                }

                setBook(currentBook)
                setSeries(currentBook.series)
                setPublisherName(currentBook.publisher?.name || '')
                debugLog('updated_by:', currentBook.updated_by)

                if (currentBook.updated_by) {

                    const { data: updatedUser, error: updatedUserError } =
                        await supabase
                            .from('profiles')
                            .select('id, display_name, email')
                            .eq('id', currentBook.updated_by)
                            .maybeSingle()

                    if (updatedUserError) {
                        throw updatedUserError
                    }

                    setUpdatedByUser(updatedUser)
                    debugLog('updatedByUser:', updatedUser)
                } else {
                    setUpdatedByUser(null)
                }

                if (currentBook.cover_image_updated_by) {

                    const { data: coverUpdatedUser, error: coverUpdatedUserError } =
                        await supabase
                            .from('profiles')
                            .select('id, display_name, email')
                            .eq('id', currentBook.cover_image_updated_by)
                            .maybeSingle()

                    if (coverUpdatedUserError) {
                        throw coverUpdatedUserError
                    }

                    setCoverUpdatedByUser(coverUpdatedUser)
                } else {
                    setCoverUpdatedByUser(null)
                }

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

                const {
                    data: { user }
                } = await supabase.auth.getUser()

                let volumesWithOwnership = sortedVolumes

                if (user) {
                    const { data: userBooks, error: userBooksError } =
                        await supabase
                            .from('user_books')
                            .select('book_id, is_owned')
                            .eq('user_id', user.id)
                            .in(
                                'book_id',
                                sortedVolumes.map((volume) => volume.id)
                            )

                    if (userBooksError) {
                        throw userBooksError
                    }

                    const ownedBookIds = new Set(
                        userBooks
                            .filter((userBook) => userBook.is_owned === true)
                            .map((userBook) => userBook.book_id)
                    )

                    volumesWithOwnership = sortedVolumes.map((volume) => ({
                        ...volume,
                        isOwned: ownedBookIds.has(volume.id)
                    }))
                }

                setVolumes(volumesWithOwnership)

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

            setOwnsBook(data?.is_owned === true)
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

    const parseBatchVolumes = (input) => {
        const volumes = []

        const parts = input
            .split(/[,，]/)
            .map(part => part.trim())
            .filter(Boolean)

        for (const part of parts) {
            if (part.includes('-')) {
                const [startText, endText] = part
                    .split('-')
                    .map(value => value.trim())

                const start = Number(startText)
                const end = Number(endText)

                if (
                    !Number.isInteger(start) ||
                    !Number.isInteger(end) ||
                    start <= 0 ||
                    end <= 0 ||
                    start > end
                ) {
                    return null
                }

                for (let i = start; i <= end; i++) {
                    volumes.push(i)
                }
            } else {
                const volume = Number(part)

                if (Number.isInteger(volume) && volume > 0) {
                    volumes.push(volume)
                    continue
                }

                // Text volumes: 全、上、下、其ノ伍、etc.
                if (part.length > 0) {
                    volumes.push(part)
                    continue
                }

                return null
            }
        }

        return [...new Set(volumes)].sort((a, b) => a - b)
    }

    const handleSubmit = async (e, ownershipChanges = null) => {
        e.preventDefault()

        if (!series.title.trim()) {
            alert('请输入书名')
            return
        }

        const parsedBatchVolumes = parseBatchVolumes(batchVolumes)

        if (batchVolumes.trim() && !parsedBatchVolumes) {
            alert('请输入有效的集数，例如：1-5、8、11-13')
            return
        }

        setSaving(true)

        try {

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

            const oldCoverPath = book.cover_image || null

            let coverPath = book.cover_image || null

            // Find or create publisher
            let publisherId = null

            const publisherNameValue = publisherName?.trim()

            if (publisherNameValue) {
                const {
                    data: existingPublisher,
                    error: publisherFindError
                } = await supabase
                    .from('publishers')
                    .select('id')
                    .eq('name', publisherNameValue)
                    .maybeSingle()

                if (publisherFindError) {
                    throw publisherFindError
                }

                if (existingPublisher) {
                    publisherId = existingPublisher.id
                } else {
                    const {
                        data: newPublisher,
                        error: publisherInsertError
                    } = await supabase
                        .from('publishers')
                        .insert({
                            name: publisherName,
                            created_by: user.id,
                            updated_by: user.id,
                        })
                        .select('id')
                        .single()

                    if (publisherInsertError) {
                        throw publisherInsertError
                    }

                    publisherId = newPublisher.id
                }
            }

            if (cover) {
                const fileExt = cover.name.split('.').pop()
                const fileName = `${crypto.randomUUID()}.${fileExt}`

                const { error: uploadError } = await supabase
                    .storage
                    .from('book-covers')
                    .upload(fileName, cover)

                if (uploadError) {
                    throw uploadError
                }

                coverPath = fileName
            } else if (removeCover) {
                coverPath = null
            }

            // Batch update ownership
            if (ownershipChanges) {
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

                for (const volume of volumes) {
                    const isOwned =
                        ownershipChanges[volume.id] === true

                    const { error } = await supabase
                        .from('user_books')
                        .upsert(
                            {
                                user_id: user.id,
                                book_id: volume.id,
                                is_owned: isOwned,
                            },
                            {
                                onConflict: 'user_id,book_id'
                            }
                        )

                    if (error) {
                        throw error
                    }
                }
            }
            // Add batch volumes
            // Handle batch edit
            if (parsedBatchVolumes.length > 0) {
                // Get all books in this series
                const { data: existingBooks, error: existingBooksError } =
                    await supabase
                        .from('books')
                        .select('*')
                        .eq('series_id', series.id)

                if (existingBooksError) {
                    throw existingBooksError
                }

                // Get current user
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

                // Process each selected volume
                for (const volume of parsedBatchVolumes) {
                    const volumeValue = String(volume)

                    let targetBook = existingBooks.find(
                        (item) => String(item.volume) === volumeValue
                    )

                    // Create book if it doesn't exist
                    if (!targetBook) {
                        const { data: newBook, error: insertError } =
                            await supabase
                                .from('books')
                                .insert({
                                    series_id: series.id,
                                    volume: volumeValue,
                                    edition: book.edition || '普通版',
                                    created_by: user.id,
                                })
                                .select()
                                .single()

                        if (insertError) {
                            throw insertError
                        }

                        targetBook = newBook
                    }

                    if (ownsBook) {
                        const {
                            data: existingUserBook,
                            error: existingUserBookError
                        } = await supabase
                            .from('user_books')
                            .select('*')
                            .eq('user_id', user.id)
                            .eq('book_id', targetBook.id)
                            .maybeSingle()

                        if (existingUserBookError) {
                            throw existingUserBookError
                        }

                        if (existingUserBook) {
                            const updates = {
                                is_owned: true
                            }

                            if (purchasedDate) {
                                updates.purchased_date = purchasedDate
                            }

                            if (purchasedPrice) {
                                updates.purchased_price = purchasedPrice
                            }

                            if (Object.keys(updates).length > 0) {
                                const { error: updateUserBookError } =
                                    await supabase
                                        .from('user_books')
                                        .update(updates)
                                        .eq('user_id', user.id)
                                        .eq('book_id', targetBook.id)

                                if (updateUserBookError) {
                                    throw updateUserBookError
                                }
                            }

                        } else {
                            const { error: insertUserBookError } =
                                await supabase
                                    .from('user_books')
                                    .insert({
                                        user_id: user.id,
                                        book_id: targetBook.id,
                                        is_owned: true,
                                        purchased_date: purchasedDate || null,
                                        purchased_price: purchasedPrice || null,
                                    })
                            if (insertUserBookError) {
                                throw insertUserBookError
                            }
                        }

                    } else {
                        // Remove ownership for this volume
                        const { error: updateUserBookError } =
                            await supabase
                                .from('user_books')
                                .update({
                                    is_owned: false,
                                    purchased_date: null,
                                    purchased_price: null,
                                })
                                .eq('user_id', user.id)
                                .eq('book_id', targetBook.id)

                        if (updateUserBookError) {
                            throw updateUserBookError
                        }
                    }
                }
            }

            // Update series information
            const {
                error: seriesError
            } = await supabase
                .from('book_series')
                .update({
                    title: series.title.trim(),
                    author: series.author || null,
                    subcategory: series.subcategory,
                    updated_by: user.id,
                })
                .eq('id', series.id)

            if (seriesError) {
                throw seriesError
            }

            // Update volume information
            const bookUpdates = {
                volume: book.volume,
                edition: book.edition || '普通版',
                isbn: book.isbn || null,
                release_date: book.release_date || null,
                publisher_id: publisherId,
                updated_by: user.id,
            }

            if (cover) {
                bookUpdates.cover_image = coverPath
                bookUpdates.cover_image_updated_by = user.id
            } else if (removeCover) {
                bookUpdates.cover_image = null
                bookUpdates.cover_image_updated_by = user.id
            }

            const {
                error: bookError
            } = await supabase
                .from('books')
                .update(bookUpdates)
                .eq('id', book.id)

            if (bookError) {
                throw bookError
            }

            // Delete old cover if it is no longer used
            if (oldCoverPath && oldCoverPath !== coverPath) {
                const { data: stillUsed, error: checkCoverError } = await supabase
                    .from('books')
                    .select('id')
                    .eq('cover_image', oldCoverPath)
                    .limit(1)

                if (checkCoverError) {
                    console.error(
                        'Failed to check old cover usage:',
                        checkCoverError
                    )
                } else if (!stillUsed?.length) {
                    const {
                        data: deleteCoverData,
                        error: deleteCoverError
                    } = await supabase
                        .storage
                        .from('book-covers')
                        .remove([oldCoverPath])

                    debugLog('Delete old cover result:', {
                        path: oldCoverPath,
                        data: deleteCoverData,
                        error: deleteCoverError
                    })
                    debugLog('Delete old cover:', oldCoverPath)
                    debugLog('Delete old cover error:', deleteCoverError)

                    if (deleteCoverError) {
                        console.error(
                            'Failed to delete old cover:',
                            deleteCoverError
                        )
                    }
                }
            }


            // Update ownership for single-book edit only
            // Update ownership for single-book edit only
            if (!ownershipChanges && parsedBatchVolumes.length === 0) {

                const {
                    data: { user }
                } = await supabase.auth.getUser()

                if (!user) {
                    throw new Error('User is not logged in')
                }

                const { error: userBookError } = await supabase
                    .from('user_books')
                    .upsert(
                        {
                            user_id: user.id,
                            book_id: book.id,
                            is_owned: ownsBook,
                            purchased_date: ownsBook
                                ? purchasedDate || null
                                : null,
                            purchased_price: ownsBook
                                ? purchasedPrice || null
                                : null,
                            updated_at: new Date().toISOString(),
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
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        const isNumericVolume = Number.isInteger(Number(book.volume))

        const confirmed = window.confirm(
            isNumericVolume
                ? `确定要删除《${series.title} - 第${book.volume}集》吗？\n\n此操作将从数据库中永久删除该书籍及此集资料，所有用户都将无法再使用此书籍。\n\n此操作无法恢复。`
                : `确定要删除《${series.title} - ${book.volume}》吗？\n\n此操作将从数据库中永久删除该书籍及此集资料，所有用户都将无法再使用此书籍。\n\n此操作无法恢复。`
        )

        if (!confirmed) {
            return
        }

        setSaving(true)

        try {
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

            if (book.created_by !== user.id) {
                throw new Error('你无法删除其他用户创建的书籍集数。')
            }

            const oldCoverPath = book.cover_image || null

            const { error: bookError } =
                await supabase
                    .from('books')
                    .delete()
                    .eq('id', book.id)

            if (bookError) {
                throw bookError
            }

            if (oldCoverPath) {
                const { data: stillUsed, error: checkCoverError } =
                    await supabase
                        .from('books')
                        .select('id')
                        .eq('cover_image', oldCoverPath)
                        .limit(1)

                if (checkCoverError) {
                    console.error(
                        'Failed to check old cover usage:',
                        checkCoverError
                    )
                } else if (!stillUsed?.length) {
                    const { error: deleteCoverError } =
                        await supabase
                            .storage
                            .from('book-covers')
                            .remove([oldCoverPath])

                    if (deleteCoverError) {
                        console.error(
                            'Failed to delete old cover:',
                            deleteCoverError
                        )
                    }
                }
            }

            navigate('/books')

        } catch (error) {
            debugError('Error deleting book:', error)
            alert(error.message || '删除失败，请稍后再试')
        } finally {
            setSaving(false)
        }
    }

    if (loading || !book || !series) {
        return (
            <>
                <Navbar section="书籍" />

                <main
                    className="edit-book-page"
                    style={{
                        backgroundImage:
                            book?.cover_image_url
                                ? `url("${book.cover_image_url}")`
                                : book?.cover_image
                                    ? `url("${supabase.storage
                                        .from('book-covers')
                                        .getPublicUrl(book.cover_image).data.publicUrl}")`
                                    : 'none'
                    }}
                >
                    <div className="edit-book-loading-overlay">
                        <Loading text="正在加载" />
                    </div>
                </main>
            </>
        )
    }

    const isNumericVolume = Number.isInteger(Number(book.volume))

    return (
        <>
            <Navbar section="书籍" />

            {saving && (
                <div className="saving-overlay">
                    <div className="saving-message">
                        Updating...
                    </div>
                </div>
            )}

            <main className="edit-book-page">

                <div className="edit-book-header">
                    <div className="edit-book-title">
                        <h1
                            onClick={async () => {
                                try {
                                    const copyText =
                                        `${series.title}${book.edition && book.edition !== '普通版'
                                            ? ` (${book.edition})`
                                            : ''
                                        }`

                                    await navigator.clipboard.writeText(copyText)
                                    alert(
                                        `已复制：${series.title}${book.edition && book.edition !== '普通版'
                                            ? ` (${book.edition})`
                                            : ''
                                        }`
                                    )
                                } catch (error) {
                                    debugError('Error copying title:', error)
                                }
                            }}
                            title="点击复制书名"
                            style={{ cursor: 'pointer' }}
                        >
                            {isNumericVolume
                                ? `${series.title} - 第${book.volume}集${book.edition && book.edition !== '普通版' ? ` (${book.edition})` : ''}`
                                : `${series.title} - ${book.volume}${book.edition && book.edition !== '普通版' ? ` (${book.edition})` : ''}`
                            }
                        </h1>
                    </div>

                    <div className="header-actions">
                        <button
                            type="button"
                            className="delete-button"
                            onClick={handleDelete}
                            disabled={saving}
                        >
                            删除
                        </button>

                        <button
                            type="button"
                            className="back-button"
                            onClick={() => navigate('/books')}
                            disabled={saving}
                        >
                            返回
                        </button>
                    </div>
                </div>

                <section
                    className="edit-book-content"
                    style={{
                        backgroundImage:
                            book?.cover_image
                                ? `url("${supabase.storage
                                    .from('book-covers')
                                    .getPublicUrl(book.cover_image).data.publicUrl}")`
                                : book?.cover_image_url
                                    ? `url("${book.cover_image_url}")`
                                    : 'none'
                    }}
                >
                    <EditBookForm
                        updatedByUser={updatedByUser}
                        publisherName={publisherName}
                        setPublisherName={setPublisherName}
                        coverUpdatedByUser={coverUpdatedByUser}
                        setBatchVolumes={setBatchVolumes}
                        batchOwnership={batchOwnership}
                        setBatchOwnership={setBatchOwnership}
                        cover={cover}
                        setCover={setCover}
                        removeCover={removeCover}
                        setRemoveCover={setRemoveCover}
                        series={series}
                        book={book}
                        batchVolumes={batchVolumes}
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
                </section>

            </main>
        </>
    )
}