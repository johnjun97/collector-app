import SuggestionInput from '../../components/SuggestionInput'
import HelpTooltip from '../../../../components/HelpTooltip'

export default function EditBookOptionalFields({
    book,
    suggestions,
    handleBookChange,
    ownsBook,
    purchasedDate,
    setPurchasedDate,
    purchasedPrice,
    setPurchasedPrice,
    coverUpdatedByUser,
    cover,
    setCover,
    removeCover,
    setRemoveCover,
    currentCover,
}) {
    return (
        <details className="optional-fields">
            <summary>其他资料（选填）</summary>

            <SuggestionInput
                id="edition"
                name="edition"
                label="版本"
                placeholder="例如：普通版、限定版、特装版"
                value={book.edition ?? ''}
                suggestions={suggestions.edition}
                onChange={handleBookChange}
            />

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

            <SuggestionInput
                id="publisher"
                name="publisher"
                label="出版社"
                placeholder="请输入出版社"
                value={book.publisher || ''}
                suggestions={suggestions.publisher}
                onChange={handleBookChange}
            />

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

                    {coverUpdatedByUser && (
                        <span className="cover-updated-by">
                             更新by：
                            {coverUpdatedByUser.display_name ||
                                coverUpdatedByUser.email}
                        </span>
                    )}
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
                        onClick={() =>
                            window.open(currentCover, '_blank')
                        }
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

                {book.cover_image &&
                    !cover &&
                    !removeCover && (
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
    )
}