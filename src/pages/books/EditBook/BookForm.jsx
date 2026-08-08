import React from 'react'

export default function BookForm({
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
    return (
        <form onSubmit={handleSubmit}>

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

            <div className="form-field">
                <label htmlFor="title">书名</label>

                <input
                    id="title"
                    name="title"
                    type="text"
                    value={series.title || ''}
                    onChange={handleSeriesChange}
                />
            </div>

            <div className="form-field">
                <label htmlFor="author">作者</label>

                <input
                    id="author"
                    name="author"
                    type="text"
                    value={series.author || ''}
                    onChange={handleSeriesChange}
                />
            </div>

            <div className="form-field">
                <label>集数</label>

                <div className="volume-buttons">
                    {volumes.map((volume) => (
                        <button
                            key={volume.id}
                            type="button"
                            className={
                                book.id === volume.id
                                    ? 'active'
                                    : ''
                            }
                            onClick={() => handleVolumeChange(volume)}
                        >
                            {volume.volume}
                        </button>
                    ))}
                </div>
            </div>

            {userBookLoading ? (
                <div className="form-field">
                    <span>加载中...</span>
                </div>
            ) : (
                <>

                    <div className="form-field">
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
                    </div>

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

                    <div className="form-field">
                        <label htmlFor="volume">集数</label>

                        <input
                            id="volume"
                            name="volume"
                            type="text"
                            value={book.volume || ''}
                            onChange={handleBookChange}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="edition">版本</label>

                        <input
                            id="edition"
                            name="edition"
                            type="text"
                            value={book.edition || '普通版'}
                            onChange={handleBookChange}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="publisher">出版社</label>

                        <input
                            id="publisher"
                            name="publisher"
                            type="text"
                            value={book.publisher || ''}
                            onChange={handleBookChange}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="isbn">ISBN</label>

                        <input
                            id="isbn"
                            name="isbn"
                            type="text"
                            value={book.isbn || ''}
                            onChange={handleBookChange}
                        />
                    </div>

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
            )}

        </form>
    )
}