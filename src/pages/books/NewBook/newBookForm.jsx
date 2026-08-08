import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import OpenCC from 'opencc-js'
import './newBookForm.css'


const converter = OpenCC.Converter({ from: 'tw', to: 'cn' })

export default function BookForm({
    initialData,
    onSubmit,
    onBatchAdd,
    onCancel
}) {

    const [form, setForm] = useState({
        subcategory: '漫画',
        title: '',
        volume: '',
        edition: '普通版',
        author: '',
        publisher: '',
        isbn: '',
        releaseDate: '',
        purchasedDate: '',
        purchasedPrice: '',
    })

    const [saving, setSaving] = useState(false)
    const [ownsBook, setOwnsBook] = useState(false)
    const [seriesSuggestions, setSeriesSuggestions] = useState([])
    const [showSeriesSuggestions, setShowSeriesSuggestions] = useState(false)
    const seriesInputRef = useRef(null)

    useEffect(() => {
        if (!initialData) return

        setForm({
            subcategory: initialData.subcategory || '漫画',
            title: initialData.title || '',
            volume: initialData.volume || '',
            edition: initialData.edition || '普通版',
            author: initialData.author || '',
            publisher: initialData.publisher || '',
            isbn: initialData.isbn || '',
            releaseDate: initialData.release_date || '',
            purchasedDate: initialData.purchased_date || '',
            purchasedPrice: initialData.purchased_price || '',
        })
    }, [initialData])

    const handleChange = (e) => {
        const value = converter(e.target.value)

        setForm({
            ...form,
            [e.target.name]: value
        })
    }

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                seriesInputRef.current &&
                !seriesInputRef.current.contains(e.target)
            ) {
                setShowSeriesSuggestions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const loadSeriesSuggestions = async (value = '') => {
        const { data, error } = await supabase
            .from('book_series')
            .select('title')
            .ilike('title', `%${value}%`)
            .order('title')
            .limit(10)

        if (error) {
            console.error('Error searching book series:', error)
            return
        }

        setSeriesSuggestions(data || [])
        setShowSeriesSuggestions(true)
    }

    const handleTitleChange = async (e) => {
        const value = converter(e.target.value)

        setForm({
            ...form,
            title: value
        })

        await loadSeriesSuggestions(value)
    }

    const parseBatchVolumes = (input) => {
        const volumes = []

        const parts = input
            .split(/[,，、]/)
            .map(part => part.trim())
            .filter(Boolean)

        for (const part of parts) {

            // Numeric range: 1-5
            if (part.includes('-')) {
                const [startText, endText] = part
                    .split('-')
                    .map(v => v.trim())

                const start = Number(startText)
                const end = Number(endText)

                if (
                    !Number.isInteger(start) ||
                    !Number.isInteger(end) ||
                    start <= 0 ||
                    end <= 0 ||
                    start > end
                ) {
                    return null
                }

                for (let i = start; i <= end; i++) {
                    volumes.push(i)
                }

            } else {
                // Numeric volume: 1, 2, 3
                const volume = Number(part)

                if (Number.isInteger(volume) && volume > 0) {
                    volumes.push(volume)
                    continue
                }

                // Text volumes: 全、上、下
                if (['全', '上', '下'].includes(part)) {
                    volumes.push(part)
                    continue
                }

                return null
            }
        }

        return [...new Set(volumes)]
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.title.trim()) {
            alert('请输入书名')
            return
        }

        if (!form.volume.trim()) {
            alert('请输入集数')
            return
        }

        const parsedVolumes = parseBatchVolumes(form.volume)

        if (!parsedVolumes || parsedVolumes.length === 0) {
            alert('请输入有效的集数，例如：1、2、3、全 或 1-5、8、11-13')
            return
        }

        setSaving(true)

        try {
            await onSubmit(
                form,
                ownsBook,
                parsedVolumes
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <form className="new-book-form" onSubmit={handleSubmit}>

            {saving && (
                <div className="saving-overlay">
                    <div className="saving-message">
                        保存中...
                    </div>
                </div>
            )}

            <div className="form-field">
                <label htmlFor="subcategory">类型</label>
                <select
                    id="subcategory"
                    name="subcategory"
                    value={form.subcategory}
                    onChange={handleChange}
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

                <div
                    className="series-input-wrapper"
                    ref={seriesInputRef}
                >
                    <input
                        id="title"
                        name="title"
                        type="text"
                        placeholder="请输入书名"
                        value={form.title}
                        onChange={handleTitleChange}
                        onFocus={() => loadSeriesSuggestions(form.title)}
                    />

                    {showSeriesSuggestions && seriesSuggestions.length > 0 && (
                        <div className="series-suggestions">
                            {seriesSuggestions.map((series) => (
                                <button
                                    key={series.title}
                                    type="button"
                                    onClick={() => {
                                        setForm({
                                            ...form,
                                            title: series.title
                                        })
                                        setShowSeriesSuggestions(false)
                                    }}
                                >
                                    {series.title}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="form-field">
                <label htmlFor="volume">集数</label>

                <input
                    id="volume"
                    name="volume"
                    type="text"
                    placeholder="例如：1、2、3、全 或 1-5、8、11-13"
                    value={form.volume}
                    onChange={handleChange}
                />
            </div>

            <div className="ownership-field">
                <label>
                    <input
                        type="checkbox"
                        checked={ownsBook}
                        onChange={(e) => setOwnsBook(e.target.checked)}
                    />
                    已入手
                </label>
            </div>

            <details className="optional-fields">
                <summary>其他资料（选填）</summary>

                <div className="form-field">
                    <label htmlFor="edition">版本</label>
                    <input
                        id="edition"
                        name="edition"
                        type="text"
                        placeholder="例如：普通版、限定版、特装版"
                        value={form.edition}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="author">作者</label>
                    <input
                        id="author"
                        name="author"
                        type="text"
                        placeholder="请输入作者"
                        value={form.author}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="publisher">出版社</label>
                    <input
                        id="publisher"
                        name="publisher"
                        type="text"
                        placeholder="请输入出版社"
                        value={form.publisher}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="isbn">ISBN</label>
                    <input
                        id="isbn"
                        name="isbn"
                        type="text"
                        placeholder="请输入 ISBN"
                        value={form.isbn}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="releaseDate">发售日期</label>
                    <input
                        id="releaseDate"
                        name="releaseDate"
                        type="date"
                        value={form.releaseDate}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="purchasedDate">购买日期</label>
                    <input
                        id="purchasedDate"
                        name="purchasedDate"
                        type="date"
                        value={form.purchasedDate}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="purchasedPrice">购买价格</label>
                    <input
                        id="purchasedPrice"
                        name="purchasedPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="请输入购买价格"
                        value={form.purchasedPrice}
                        onChange={handleChange}
                    />
                </div>

                <div className="ownership-field">
                    <label htmlFor="cover">封面: </label>
                    <input
                        id="cover"
                        type="file"
                        accept="image/*"
                    />
                </div>

            </details>

            <div className="form-actions">
                <button
                    type="button"
                    onClick={onCancel}
                >
                    取消
                </button>

                <button type="submit" disabled={saving}>
                    {saving ? '保存中...' : '保存'}
                </button>
            </div>
        </form>
    )
}