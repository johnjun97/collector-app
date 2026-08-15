import { useEffect, useRef, useState } from 'react'

export default function SuggestionInput({
    id,
    name,
    label,
    placeholder,
    value,
    suggestions = [],
    onChange,
}) {

    const [showSuggestions, setShowSuggestions] = useState(false)
    const inputRef = useRef(null)


    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                inputRef.current &&
                !inputRef.current.contains(e.target)
            ) {
                setShowSuggestions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener(
                'mousedown',
                handleClickOutside
            )
        }
    }, [])

    const inputValue =
        typeof value === 'string'
            ? value
            : value?.name || ''

    const filteredSuggestions = suggestions.filter((item) => {
        const suggestionValue =
            typeof item === 'string'
                ? item
                : item?.name || ''

        return suggestionValue
            .toLowerCase()
            .includes(inputValue.toLowerCase())
    })

    return (
        <div className="form-field" ref={inputRef}>
            <label htmlFor={id}>{label}</label>

            <div className="series-input-wrapper">
                <input
                    id={id}
                    name={name}
                    type="text"
                    placeholder={placeholder}
                    value={inputValue}
                    autoComplete="off"
                    onChange={onChange}
                    onFocus={() => setShowSuggestions(true)}
                />

                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="series-suggestions">
                        {filteredSuggestions.map((suggestion) => {
                            const selectedValue =
                                typeof suggestion === 'string'
                                    ? suggestion
                                    : suggestion?.name || ''

                            return (
                                <button
                                    key={selectedValue}
                                    type="button"
                                    onClick={() => {
                                        onChange({
                                            target: {
                                                name,
                                                value: selectedValue,
                                            },
                                        })

                                        setShowSuggestions(false)
                                    }}
                                >
                                    {selectedValue}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )

}
