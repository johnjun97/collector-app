import React, { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import SuggestionInput from '../components/SuggestionInput'
import './editBookForm.css'
import HelpTooltip from '../../../components/HelpTooltip'

export default function editBookForm({
    updatedByUser,
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

    const [showOwnershipBatchEdit, setShowOwnershipBatchEdit] =
        React.useState(false)

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

            <div className="form-field">
                <div className="volume-field-header">
                    <label>集数</label>

                    <div className="batch-add-wrapper">
                        <button
                            type="button"
                            className="batch-add-button"
                            onClick={() => {
                                navigate('/books/new', {
                                    state: {
                                        initialData: {
                                            subcategory: series.subcategory || '漫画',
                                            title: series.title || '',
                                            author: series.author || '',
                                            publisher: book.publisher || '',
                                            edition: book.edition || '普通版',
                                        }
                                    }
                                })
                            }}
                        >
                            新增集数
                        </button>

                        <HelpTooltip>
                            购买日期和购买价格如有填写，
                            将应用于所有批量新增的集数。
                            留空则不会修改已有集数的相关资料。
                        </HelpTooltip>

                    </div>
                </div>

                <div
                    className={`volume-buttons ${showOwnershipBatchEdit
                        ? 'batch-edit-active'
                        : ''
                        }`}
                >
                    {[...volumes]
                        .sort((a, b) => {
                            const aNum = Number(a.volume)
                            const bNum = Number(b.volume)

                            if (!isNaN(aNum) && !isNaN(bNum) && aNum !== bNum) {
                                return aNum - bNum
                            }

                            const aIsNormal =
                                !a.edition || a.edition === '普通版'

                            const bIsNormal =
                                !b.edition || b.edition === '普通版'

                            if (aIsNormal && !bIsNormal) return -1
                            if (!aIsNormal && bIsNormal) return 1

                            return String(a.edition || '')
                                .localeCompare(String(b.edition || ''))
                        })
                        .map((volume) => (
                            <button
                                key={volume.id}
                                type="button"
                                className={[
                                    book.id === volume.id ? 'active' : '',
                                    volume.isOwned ? 'owned' : ''
                                ].join(' ')}
                                onClick={() => {
                                    if (!showOwnershipBatchEdit) {
                                        handleVolumeChange(volume)
                                    }
                                }}
                            >
                                {volume.volume}
                                {volume.edition && volume.edition !== '普通版' && (
                                    <span className="volume-edition">
                                        {' '}({volume.edition})
                                    </span>
                                )}
                            </button>
                        ))}
                </div>
            </div>

            {userBookLoading ? (
                <div className="form-field" >
                    <span>加载中...</span>
                </div>
            ) : (
                <>

                    <div className="form-field">
                        <div className="ownership-field-header">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={ownsBook}
                                    onChange={(e) =>
                                        setOwnsBook(e.target.checked)
                                    }
                                />
                                已入手
                            </label>

                            <button
                                type="button"
                                className={`batch-add-button ${showOwnershipBatchEdit ? 'active' : ''
                                    }`}
                                onClick={() => {
                                    const nextState = !showOwnershipBatchEdit

                                    setShowOwnershipBatchEdit(nextState)


                                    if (nextState) {
                                        const initialOwnership = {}

                                        volumes.forEach((volume) => {
                                            initialOwnership[volume.id] =
                                                volume.isOwned === true
                                        })

                                        setBatchOwnership(initialOwnership)
                                    }
                                }}
                            >
                                {showOwnershipBatchEdit
                                    ? '关闭批量编辑'
                                    : '批量编辑'}
                            </button>

                        </div>
                    </div>

                    {showOwnershipBatchEdit && (
                        <div className="ownership-batch-list">
                            {volumes.map((volume) => (
                                <label
                                    key={volume.id}
                                    className={`ownership-batch-item ${batchOwnership[volume.id]
                                        ? 'owned'
                                        : ''
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={
                                            batchOwnership[volume.id] === true
                                        }
                                        onChange={(e) => {
                                            setBatchOwnership({
                                                ...batchOwnership,
                                                [volume.id]: e.target.checked
                                            })
                                        }}
                                    />

                                    <span>
                                        第{volume.volume}集

                                        {volume.edition &&
                                            volume.edition !== '普通版' && (
                                                <>
                                                    {' '}
                                                    ({volume.edition})
                                                </>
                                            )}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}

                    <details className="optional-fields">
                        <summary>其他资料（选填）</summary>

                        {/* 版本 */}
                        <SuggestionInput
                            id="edition"
                            name="edition"
                            label="版本"
                            placeholder="例如：普通版、限定版、特装版"
                            value={book.edition ?? ''}
                            suggestions={suggestions.edition}
                            onChange={handleBookChange}
                        />

                        {/* 购买日期和价格 */}
                        {ownsBook && (
                            <>
                                <div className="form-field">
                                    <label htmlFor="purchasedDate">
                                        购买日期
                                    </label>

                                    <input
                                        id="purchasedDate"
                                        type="date"
                                        value={purchasedDate}
                                        onChange={(e) =>
                                            setPurchasedDate(e.target.value)
                                        }
                                    />
                                </div>

                                <div className="form-field">
                                    <label htmlFor="purchasedPrice">
                                        购买价格
                                    </label>

                                    <input
                                        id="purchasedPrice"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={purchasedPrice}
                                        onChange={(e) =>
                                            setPurchasedPrice(e.target.value)
                                        }
                                    />
                                </div>
                            </>
                        )}

                        {/* 出版社 */}
                        <SuggestionInput
                            id="publisher"
                            name="publisher"
                            label="出版社"
                            placeholder="请输入出版社"
                            value={book.publisher || ''}
                            suggestions={suggestions.publisher}
                            onChange={handleBookChange}
                        />

                        {/* ISBN */}
                        <div className="form-field">
                            <label htmlFor="isbn">ISBN</label>

                            <input
                                id="isbn"
                                name="isbn"
                                type="text"
                                value={book.isbn || ''}
                                onChange={handleBookChange}
                                autoComplete="off"
                            />
                        </div>

                        {/* 发售日期 */}
                        <div className="form-field">
                            <label htmlFor="release_date">
                                发售日期
                            </label>

                            <input
                                id="release_date"
                                name="release_date"
                                type="date"
                                value={book.release_date || ''}
                                onChange={handleBookChange}
                            />
                        </div>

                        <div className="form-field">
                            <div className="form-field-label">
                                <label htmlFor="cover">
                                    封面
                                </label>

                                <HelpTooltip>
                                    上传新封面将替换当前集数的封面。
                                </HelpTooltip>
                            </div>

                            {cover ? (
                                <img
                                    src={URL.createObjectURL(cover)}
                                    alt="新封面预览"
                                    className="current-cover-preview"
                                />
                            ) : removeCover ? (
                                <div className="no-cover">
                                    封面将被移除
                                </div>
                            ) : currentCover ? (
                                <img
                                    src={currentCover}
                                    alt="当前封面"
                                    className="current-cover-preview"
                                    onClick={() => window.open(currentCover, '_blank')}
                                />
                            ) : (
                                <div className="no-cover">
                                    暂无封面
                                </div>
                            )}

                            <input
                                id="cover"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) =>
                                    setCover(e.target.files?.[0] || null)
                                }
                            />

                            {book.cover_image && !cover && !removeCover && (
                                <button
                                    type="button"
                                    className="remove-cover-button"
                                    onClick={() => setRemoveCover(true)}
                                >
                                    移除封面
                                </button>
                            )}

                            {removeCover && (
                                <button
                                    type="button"
                                    className="remove-cover-button"
                                    onClick={() => setRemoveCover(false)}
                                >
                                    取消移除
                                </button>
                            )}
                        </div>

                    </details>


                    <div className="form-actions">

                        <button
                            type="submit"
                            disabled={saving}
                        >
                            {saving ? '保存中...' : '保存'}
                        </button>

                        {updatedByUser && (
                            <div className="updated-by">
                                最后更新：{updatedByUser.display_name || updatedByUser.email}
                            </div>
                        )}

                    </div>

                </>
            )
            }

        </form >
    )
}