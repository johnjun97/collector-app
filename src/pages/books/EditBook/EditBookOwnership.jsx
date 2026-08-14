export default function EditBookOwnership({
    ownsBook,
    setOwnsBook,
    volumes,
    batchOwnership,
    setBatchOwnership,
    showOwnershipBatchEdit,
    setShowOwnershipBatchEdit,
}) {

    return (
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
        </>
    )
}