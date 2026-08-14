import React, { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import SuggestionInput from '../components/SuggestionInput'
import './editBookForm.css'
import HelpTooltip from '../../../components/HelpTooltip'
import EditBookOwnership from './EditBookOwnership'
import EditBookVolumes from './EditBookVolumes'
import EditBookOptionalFields from './EditBookOptionalFields'

export default function editBookForm({
    updatedByUser,
    coverUpdatedByUser,
    batchOwnership,
    setBatchOwnership,
    batchVolumes,
    setBatchVolumes,
    cover,
    setCover,
    removeCover,
    setRemoveCover,
    series,
    book,
    userBookLoading,
    volumes,
    ownsBook,
    setOwnsBook,
    purchasedDate,
    setPurchasedDate,
    purchasedPrice,
    setPurchasedPrice,
    saving,
    handleSeriesChange,
    handleBookChange,
    handleVolumeChange,
    handleSubmit,
    navigate
}) {

    const [showOwnershipBatchEdit, setShowOwnershipBatchEdit] =
        useState(false)

    const [currentCoverUrl, setCurrentCoverUrl] = useState(null)

    useEffect(() => {
        if (!book?.cover_image) {
            setCurrentCoverUrl(null)
            return
        }

        const { data } = supabase
            .storage
            .from('book-covers')
            .getPublicUrl(book.cover_image)

        setCurrentCoverUrl(data.publicUrl)
    }, [book?.cover_image])

    const [suggestions, setSuggestions] = useState({
        title: [],
        edition: [],
        author: [],
        publisher: [],
    })

    const loadSuggestions = async () => {
        const { data, error } = await supabase
            .from('books')
            .select(`
            edition,
            publisher,
            updated_at,
            series:book_series (
                title,
                author,
                updated_at
            )
        `)

        if (error) {
            console.error('Error loading book suggestions:', error)
            return
        }

        const getSuggestions = (getValue) => {
            const latestByValue = new Map()

            for (const book of data || []) {
                const value = getValue(book)

                if (!value) continue

                const bookDate = new Date(book.updated_at).getTime()
                const seriesDate = new Date(
                    book.series?.updated_at || 0
                ).getTime()

                const latestDate = Math.max(bookDate, seriesDate)
                const existing = latestByValue.get(value)

                if (!existing || latestDate > existing.date) {
                    latestByValue.set(value, {
                        value,
                        date: latestDate,
                    })
                }
            }

            return [...latestByValue.values()]
                .sort((a, b) => b.date - a.date)
                .map((item) => item.value)
        }

        setSuggestions({
            title: getSuggestions(
                (book) => book.series?.title
            ),
            author: getSuggestions(
                (book) => book.series?.author
            ),
            edition: getSuggestions(
                (book) => book.edition
            ),
            publisher: getSuggestions(
                (book) => book.publisher
            ),
        })
    }

    useEffect(() => {
        loadSuggestions()
    }, [])
    const getCurrentCover = () => {
        // Current volume has its own cover
        if (book?.cover_image_url) {
            return book.cover_image_url
        }

        if (book?.cover_image) {
            const { data } = supabase.storage
                .from('book-covers')
                .getPublicUrl(book.cover_image)

            return data.publicUrl
        }

        // Find the latest volume with a cover
        const volumeWithCover = [...volumes]
            .filter((volume) => volume.cover_image_url || volume.cover_image)
            .sort((a, b) => {
                const aNum = Number(a.volume)
                const bNum = Number(b.volume)

                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return bNum - aNum
                }

                return String(b.volume).localeCompare(String(a.volume))
            })
        [0]

        if (!volumeWithCover) {
            return null
        }

        if (volumeWithCover.cover_image_url) {
            return volumeWithCover.cover_image_url
        }

        const { data } = supabase.storage
            .from('book-covers')
            .getPublicUrl(volumeWithCover.cover_image)

        return data.publicUrl
    }

    const currentCover = getCurrentCover()

    return (
        <form
            className="book-edit-form"
            style={
                currentCover
                    ? {
                        backgroundImage: `url("${currentCover}")`,
                    }
                    : undefined
            }
            onSubmit={(e) =>
                handleSubmit(
                    e,
                    showOwnershipBatchEdit
                        ? batchOwnership
                        : null
                )
            }
        >

            <div className="form-field">
                <label htmlFor="subcategory">类型</label>

                <select
                    id="subcategory"
                    name="subcategory"
                    value={series.subcategory || '漫画'}
                    onChange={handleSeriesChange}
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

            <SuggestionInput
                id="title"
                name="title"
                label="书名"
                placeholder="请输入书名"
                value={series.title || ''}
                suggestions={suggestions.title}
                onChange={handleSeriesChange}
            />

            <SuggestionInput
                id="author"
                name="author"
                label="作者"
                placeholder="请输入作者"
                value={series.author || ''}
                suggestions={suggestions.author}
                onChange={handleSeriesChange}
            />

            <EditBookVolumes
                series={series}
                book={book}
                volumes={volumes}
                showOwnershipBatchEdit={showOwnershipBatchEdit}
                handleVolumeChange={handleVolumeChange}
                navigate={navigate}
            />

            {userBookLoading ? (
                <div className="form-field" >
                    <span>加载中...</span>
                </div>
            ) : (
                <>

                    <EditBookOwnership
                        ownsBook={ownsBook}
                        setOwnsBook={setOwnsBook}
                        volumes={volumes}
                        batchOwnership={batchOwnership}
                        setBatchOwnership={setBatchOwnership}
                        showOwnershipBatchEdit={showOwnershipBatchEdit}
                        setShowOwnershipBatchEdit={setShowOwnershipBatchEdit}
                    />

                    <EditBookOptionalFields
                        book={book}
                        suggestions={suggestions}
                        handleBookChange={handleBookChange}
                        ownsBook={ownsBook}
                        purchasedDate={purchasedDate}
                        setPurchasedDate={setPurchasedDate}
                        purchasedPrice={purchasedPrice}
                        setPurchasedPrice={setPurchasedPrice}
                        coverUpdatedByUser={coverUpdatedByUser}
                        cover={cover}
                        setCover={setCover}
                        removeCover={removeCover}
                        setRemoveCover={setRemoveCover}
                        currentCover={currentCover}
                    />

                    <div className="form-actions">

                        <button
                            type="submit"
                            disabled={saving}
                        >
                            {saving ? '保存中...' : '保存'}
                        </button>

                        {/* {updatedByUser && (
                            <div className="updated-by">
                                最后更新：{updatedByUser.display_name || updatedByUser.email}
                            </div>
                        )} */}

                    </div>

                </>
            )
            }

        </form >
    )
}