import React, { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import SuggestionInput from '../components/SuggestionInput'
import './editBookForm.css'

export default function BookForm({
    batchOwnership,
    setBatchOwnership,
    batchVolumes,
    setBatchVolumes,
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

    const [showBatchAdd, setShowBatchAdd] = React.useState(false)

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

    return (
        <form
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
                                const nextState = !showBatchAdd

                                setShowBatchAdd(nextState)

                                if (nextState) {
                                    setShowOwnershipBatchEdit(false)
                                } else {
                                    setBatchVolumes('')
                                }
                            }}
                        >
                            {showBatchAdd ? '关闭批量编辑' : '批量编辑'}
                        </button>

                        <span className="batch-add-help">
                            !
                            <span className="batch-add-tooltip">
                                购买日期和购买价格如有填写，
                                将应用于所有批量编辑的集数。
                                留空则不会修改已有集数的相关资料。
                            </span>
                        </span>
                    </div>
                </div>

                <div
                    className={`volume-buttons ${showBatchAdd || showOwnershipBatchEdit
                        ? 'batch-edit-active'
                        : ''
                        }`}
                >
                    {volumes.map((volume) => (
                        <button
                            key={volume.id}
                            type="button"
                            className={[
                                book.id === volume.id ? 'active' : '',
                                volume.isOwned ? 'owned' : ''
                            ].join(' ')}
                            onClick={() => {
                                if (!showBatchAdd && !showOwnershipBatchEdit) {
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

            {showBatchAdd && (
                <div className="form-field">
                    <input
                        type="text"
                        placeholder="例如：1-5、8、11-13"
                        value={batchVolumes}
                        onChange={(e) => setBatchVolumes(e.target.value)}
                    />
                </div>
            )}

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
                                        setShowBatchAdd(false)

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
                            value={book.edition || '普通版'}
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
                    </details>


                    <div className="form-actions">

                        <button
                            type="button"
                            onClick={() => navigate('/books')}
                        >
                            取消
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                        >
                            {saving ? '保存中...' : '保存'}
                        </button>

                    </div>

                </>
            )
            }

        </form >
    )
}