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

    const filteredSuggestions = suggestions.filter((item) =>
        item.toLowerCase().includes(value.toLowerCase())
    )

    return (
        <div className="form-field" ref={inputRef}>
            <label htmlFor={id}>{label}</label>

            <div className="series-input-wrapper">
                <input
                    id={id}
                    name={name}
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    autoComplete="off"
                    onChange={onChange}
                    onFocus={() => setShowSuggestions(true)}
                />

                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="series-suggestions">
                        {filteredSuggestions.map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => {
                                    onChange({
                                        target: {
                                            name,
                                            value: suggestion,
                                        },
                                    })

                                    setShowSuggestions(false)
                                }}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )

}
