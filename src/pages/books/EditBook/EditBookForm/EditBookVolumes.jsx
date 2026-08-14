import HelpTooltip from '../../../../components/HelpTooltip'

export default function EditBookVolumes({
    series,
    book,
    volumes,
    showOwnershipBatchEdit,
    handleVolumeChange,
    navigate,
}) {
    return (
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
                                        subcategory:
                                            series.subcategory || '漫画',
                                        title:
                                            series.title || '',
                                        author:
                                            series.author || '',
                                        publisher:
                                            book.publisher || '',
                                        edition:
                                            book.edition || '普通版',
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
                className={`volume-buttons ${
                    showOwnershipBatchEdit
                        ? 'batch-edit-active'
                        : ''
                }`}
            >
                {[...volumes]
                    .sort((a, b) => {
                        const aNum = Number(a.volume)
                        const bNum = Number(b.volume)

                        if (
                            !isNaN(aNum) &&
                            !isNaN(bNum) &&
                            aNum !== bNum
                        ) {
                            return aNum - bNum
                        }

                        const aIsNormal =
                            !a.edition ||
                            a.edition === '普通版'

                        const bIsNormal =
                            !b.edition ||
                            b.edition === '普通版'

                        if (aIsNormal && !bIsNormal) return -1
                        if (!aIsNormal && bIsNormal) return 1

                        return String(a.edition || '')
                            .localeCompare(
                                String(b.edition || '')
                            )
                    })
                    .map((volume) => (
                        <button
                            key={volume.id}
                            type="button"
                            className={[
                                book.id === volume.id
                                    ? 'active'
                                    : '',
                                volume.isOwned
                                    ? 'owned'
                                    : ''
                            ].join(' ')}
                            onClick={() => {
                                if (!showOwnershipBatchEdit) {
                                    handleVolumeChange(volume)
                                }
                            }}
                        >
                            {volume.volume}

                            {volume.edition &&
                                volume.edition !== '普通版' && (
                                    <span className="volume-edition">
                                        {' '}({volume.edition})
                                    </span>
                                )}
                        </button>
                    ))}
            </div>
        </div>
    )
}