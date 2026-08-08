import { useState } from 'react'

export default function BatchAddVolumes({
    existingVolumes = [],
    onChange
}) {
    const [fromVolume, setFromVolume] = useState('')
    const [toVolume, setToVolume] = useState('')

    const handleChange = (from, to) => {
        const start = Number(from)
        const end = Number(to)

        if (
            !Number.isInteger(start) ||
            !Number.isInteger(end) ||
            start > end
        ) {
            onChange([])
            return
        }

        const existing = existingVolumes.map((volume) =>
            String(volume)
        )

        const volumes = []

        for (let i = start; i <= end; i++) {
            const volume = String(i)

            if (!existing.includes(volume)) {
                volumes.push(volume)
            }
        }

        onChange(volumes)
    }

    const handleFromChange = (e) => {
        const value = e.target.value
        setFromVolume(value)
        handleChange(value, toVolume)
    }

    const handleToChange = (e) => {
        const value = e.target.value
        setToVolume(value)
        handleChange(fromVolume, value)
    }

    return (
        <div className="batch-add-volumes">

            <div className="batch-volume-row">

                <div className="form-field">
                    <label htmlFor="batch-from">
                        从
                    </label>

                    <input
                        id="batch-from"
                        type="number"
                        min="1"
                        value={fromVolume}
                        onChange={handleFromChange}
                        placeholder="例如：1"
                    />
                </div>

                <span className="batch-volume-separator">
                    至
                </span>

                <div className="form-field">
                    <label htmlFor="batch-to">
                        到
                    </label>

                    <input
                        id="batch-to"
                        type="number"
                        min="1"
                        value={toVolume}
                        onChange={handleToChange}
                        placeholder="例如：10"
                    />
                </div>

            </div>

        </div>
    )
}