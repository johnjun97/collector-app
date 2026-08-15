import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import OpenCC from 'opencc-js'
import SuggestionInput from '../components/SuggestionInput'
import './newBookForm.css'
import HelpTooltip from '../../../components/HelpTooltip'
import Loading from '../../../components/Loading.jsx'
import ISBNLookup from '../../../components/ISBNLookup/ISBNLookup'

const converter = OpenCC.Converter({ from: 'tw', to: 'cn' })

export default function NewBookForm({
    initialData,
    onSubmit,
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
        cover: null,
        coverUrl: '',
    })

    const [saving, setSaving] = useState(false)
    const [ownsBook, setOwnsBook] = useState(true)
    const [batchMode, setBatchMode] = useState(false)
    const [batchVolumes, setBatchVolumes] = useState(false)

    const [suggestions, setSuggestions] = useState({
        title: [],
        edition: [],
        author: [],
        publisher: [],
    })

    useEffect(() => {
        if (!initialData) return

        setForm({
            subcategory: initialData.subcategory || '漫画',
            title: initialData.title || '',
            volume: initialData.volume || '',
            edition: initialData.edition || '普通版',
            author: initialData.author || '',
            publisher:
                typeof initialData.publisher === 'string'
                    ? initialData.publisher
                    : initialData.publisher?.name || '',
            isbn: initialData.isbn || '',
            releaseDate: initialData.release_date || '',
            purchasedDate: initialData.purchased_date || '',
            purchasedPrice: initialData.purchased_price || '',
            cover: null,
            coverUrl: initialData.cover_url || '',
        })
    }, [initialData])

    const handleChange = (e) => {
        const value =
            e.target.name === 'subcategory'
                ? e.target.value
                : converter(e.target.value)

        setForm({
            ...form,
            [e.target.name]: value
        })
    }

    const loadSuggestions = async () => {
        const { data: books, error: booksError } = await supabase
            .from('books')
            .select(`
            edition,
            updated_at,
            series:book_series!inner (
                title,
                author,
                subcategory,
                updated_at
            )
        `)
            .eq('series.subcategory', form.subcategory)

        if (booksError) {
            console.error('Error loading book suggestions:', booksError)
            return
        }

        const getSuggestions = (getValue) => {
            const latestByValue = new Map()

            for (const book of books || []) {
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
                .map(item => item.value)
        }

        // Load publisher names from publishers table
        const { data: publishers, error: publishersError } =
            await supabase
                .from('publishers')
                .select('name')
                .order('name')

        if (publishersError) {
            console.error(
                'Error loading publisher suggestions:',
                publishersError
            )
            return
        }

        setSuggestions({
            title: getSuggestions(
                book => book.series?.title
            ),

            author: getSuggestions(
                book => book.series?.author
            ),

            edition: getSuggestions(
                book => book.edition
            ),

            publisher: (publishers || []).map(
                publisher => publisher.name
            ),
        })
    }

    useEffect(() => {
        loadSuggestions()
    }, [form.subcategory])

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

                // Text volumes: 全、上、下、其ノ伍、etc.
                if (part.length > 0) {
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

        let parsedVolumes

        if (batchMode) {
            parsedVolumes = parseBatchVolumes(form.volume)

            if (!parsedVolumes || parsedVolumes.length === 0) {
                alert('请输入有效的批量集数，例如：1-5、8、11-13')
                return
            }
        } else {
            let volume = form.volume.trim()

            if (!volume) {
                alert('请输入集数')
                return
            }

            // Single volume mode does not allow ranges
            if (volume.includes('-')) {
                alert('单集模式不能使用范围，例如 1-14。请勾选「批量集数」')
                return
            }

            // Normalize numeric volumes: 01 -> 1, 001 -> 1
            if (/^\d+$/.test(volume)) {
                volume = String(Number(volume))
            }

            parsedVolumes = [volume]
        }

        setSaving(true)

        try {
            await onSubmit(
                form,
                ownsBook,
                parsedVolumes,
                batchMode
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
                        <Loading
                            text="保存中"
                            inline
                        />
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

            {!batchMode && (
                <ISBNLookup
                    isbn={form.isbn}
                    onISBNChange={(value) =>
                        setForm(prev => ({
                            ...prev,
                            isbn: value
                        }))
                    }
                    onBookData={(data) =>
                        setForm(prev => ({
                            ...prev,
                            ...data
                        }))
                    }
                />
            )}

            {
                form.coverUrl && (
                    <div className="form-field">
                        <label>Google Books 封面</label>

                        <img
                            src={form.coverUrl}
                            alt="Book cover"
                            style={{
                                width: '120px',
                                height: 'auto',
                                display: 'block',
                                marginTop: '8px'
                            }}
                        />
                    </div>
                )
            }

            <SuggestionInput
                id="title"
                name="title"
                label="书名"
                placeholder="请输入书名"
                value={form.title}
                suggestions={suggestions.title}
                onChange={handleChange}
            />

            <div className="form-field">
                <div className="volume-field-header">
                    <label htmlFor="volume">
                        集数
                    </label>

                    <button
                        type="button"
                        className={`batch-add-button ${batchMode ? 'active' : ''}`}
                        onClick={() => {
                            setBatchMode(prev => !prev)
                            setForm(prev => ({
                                ...prev,
                                volume: ''
                            }))
                        }}
                    >
                        批量集数
                    </button>
                </div>

                <input
                    id="volume"
                    name="volume"
                    type="text"
                    placeholder={
                        batchMode
                            ? '例如：1-5, 8, 11-13'
                            : '例如：1'
                    }
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

                <HelpTooltip>
                    勾选后，所有输入的集数都会标记为「已入手」。
                </HelpTooltip>
            </div>

            <details className="optional-fields">

                <summary>其他资料（选填）</summary>

                <SuggestionInput
                    id="edition"
                    name="edition"
                    label="版本"
                    placeholder="例如：普通版、限定版、特装版"
                    value={form.edition}
                    suggestions={suggestions.edition}
                    onChange={handleChange}
                />

                <SuggestionInput
                    id="author"
                    name="author"
                    label="作者"
                    placeholder="请输入作者"
                    value={form.author}
                    suggestions={suggestions.author}
                    onChange={handleChange}
                />

                <SuggestionInput
                    id="publisher"
                    name="publisher"
                    label="出版社"
                    placeholder="请输入出版社"
                    value={form.publisher}
                    suggestions={suggestions.publisher}
                    onChange={handleChange}
                />

                {!batchMode && (
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
                )}

                {!batchMode && (
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
                )}

                {!batchMode && (
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
                )}

                {!batchMode && (
                    <div className="form-field">
                        <label htmlFor="cover">封面
                            <HelpTooltip>
                                上传的封面将应用于本次新增的所有集数。
                            </HelpTooltip>
                        </label>

                        <input
                            id="cover"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    cover: e.target.files?.[0] || null
                                })
                            }
                        />


                    </div>
                )}
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
        </form >
    )
}