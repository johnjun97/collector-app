import SuggestionInput from '../../components/SuggestionInput'
import ISBNLookup from '../../../../components/ISBNLookup/ISBNLookup'
import HelpTooltip from '../../../../components/HelpTooltip'

export default function EditBookOptionalFields({
    book,
    suggestions,
    publisherName,
    setPublisherName,
    onISBNBookData,
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
    isGoogleCover,
    isCurrentVolumeCover,
    currentCoverVolume
}) {
    return (
        <details className="optional-fields">
            <summary>其他资料（选填）</summary>

            <SuggestionInput
                id="publisher"
                name="publisher"
                label="出版社"
                placeholder="请输入出版社"
                value={publisherName}
                suggestions={suggestions.publisher}
                onChange={(e) => setPublisherName(e.target.value)}
            />

            <SuggestionInput
                id="edition"
                name="edition"
                label="版本"
                placeholder="例如：普通版、限定版、特装版"
                value={book.edition || ''}
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

            <ISBNLookup
                isbn={book.isbn || ''}
                onISBNChange={(value) =>
                    handleBookChange({
                        target: {
                            name: 'isbn',
                            value
                        }
                    })
                }
                onBookData={onISBNBookData}
            />

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

                    {!isCurrentVolumeCover && currentCoverVolume && (
                        <span>
                            （当前封面来自第 {currentCoverVolume} 集）
                        </span>
                    )}


                    {isGoogleCover && (
                        <span className="cover-provided-by-google">
                            (Provided by Google API)
                        </span>
                    )}
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

                <div className="cover-actions">
                    <label
                        htmlFor="cover"
                        className="upload-cover-button"
                    >
                        选择新封面
                    </label>

                    <input
                        id="cover"
                        className="cover-file-input"
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
            </div>
        </details>
    )
}