import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import OpenCC from 'opencc-js'
import SuggestionInput from '../components/SuggestionInput'
import './newBookForm.css'
import HelpTooltip from '../../../components/HelpTooltip'
import { BrowserMultiFormatReader } from '@zxing/browser'
import Loading from '../../../components/Loading.jsx'
import useMessage from '../../../components/useMessage'

const converter = OpenCC.Converter({ from: 'tw', to: 'cn' })

export default function NewBookForm({
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
        cover: null,
        coverUrl: '',
    })

    const [saving, setSaving] = useState(false)
    const [ownsBook, setOwnsBook] = useState(true)
    const [lookingUpISBN, setLookingUpISBN] = useState(false)
    const [scanningISBN, setScanningISBN] = useState(false)
    const [detectedISBN, setDetectedISBN] = useState('')
    const [lookupMessage, setLookupMessage] = useMessage()
    const [isbnLookupError, setIsbnLookupError] = useMessage()

    const videoRef = useRef(null)
    const scannerControlsRef = useRef(null)

    const lookupISBN = async (isbnValue = form.isbn) => {
        const isbn = isbnValue.trim()
        setLookupMessage('')
        setIsbnLookupError('')

        if (!isbn) {
            setLookupMessage('请输入 ISBN')
            return
        }

        setLookingUpISBN(true)

        // Prevent Google Books from hanging forever
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        try {
            const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY

            console.log('API key exists:', !!apiKey)

            console.log('Starting Google Books request...')
            console.log(
                `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}&key=${apiKey}`
            )
            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}&key=${apiKey}`,
                {
                    signal: controller.signal
                }
            )

            if (!response.ok) {
                throw new Error(
                    `Google Books API 请求失败: ${response.status}`
                )
            }

            const data = await response.json()

            if (!data.items || data.items.length === 0) {
                setForm(prev => ({
                    ...prev,
                    isbn: ''
                }))

                setLookupMessage('Google Books: Books no found')
                return
            }

            const info = data.items[0].volumeInfo

            const apiAuthor = info.authors?.join(', ') || ''

            let authorName = apiAuthor

            if (apiAuthor) {
                const { data: authorAlias, error: authorAliasError } =
                    await supabase
                        .from('author_aliases')
                        .select('chinese_name')
                        .eq('source_name', apiAuthor)
                        .maybeSingle()

                if (authorAliasError) {
                    console.error('Author alias lookup error:', authorAliasError)
                }

                if (authorAlias) {
                    authorName = authorAlias.chinese_name
                }
            }

            const rawTitle = info.title || ''
            const rawSubtitle = info.subtitle || ''

            const combinedTitle = rawSubtitle
                ? `${rawTitle} ${rawSubtitle}`
                : rawTitle

            // Detect volume at the end:
            // (1), (2), （1）, （2）, (全), （全）, (上), (下), （上）, （下）
            const volumeMatch = combinedTitle.match(
                /[\s]*[（(](\d+|全|上|下)[）)]$/
            )

            const cleanTitle = volumeMatch
                ? combinedTitle.replace(
                    /[\s]*[（(](\d+|全|上|下)[）)]$/,
                    ''
                )
                : combinedTitle

            const volume = volumeMatch
                ? volumeMatch[1]
                : ''

            const missingInfo = []

            if (!info.imageLinks) {
                missingInfo.push('封面')
            }

            if (!info.authors?.length) {
                missingInfo.push('作者')
            }

            if (!info.publisher) {
                missingInfo.push('出版社')
            }

            if (!info.publishedDate) {
                missingInfo.push('发售日期')
            }

            if (!volumeMatch) {
                missingInfo.push('集数')
            }

            if (missingInfo.length > 0) {
                setIsbnLookupError(
                    `Google Books 未提供：${missingInfo.join('、')}`
                )
            } else {
                setIsbnLookupError('')
            }

            const isbn13 =
                info.industryIdentifiers?.find(
                    item => item.type === 'ISBN_13'
                )?.identifier || ''

            const isbn10 =
                info.industryIdentifiers?.find(
                    item => item.type === 'ISBN_10'
                )?.identifier || ''

            setForm(prev => ({
                ...prev,

                title: converter(cleanTitle) || prev.title,

                volume: volume || prev.volume,

                author:
                    converter(authorName) ||
                    prev.author,

                publisher:
                    converter(info.publisher || '') ||
                    prev.publisher,

                releaseDate: (() => {
                    const date = info.publishedDate

                    if (!date) return prev.releaseDate

                    if (/^\d{4}$/.test(date)) {
                        return `${date}-01-01`
                    }

                    if (/^\d{4}-\d{2}$/.test(date)) {
                        return `${date}-01`
                    }

                    return date.slice(0, 10)
                })(),
                isbn: isbn13 || isbn10 || prev.isbn,

                coverUrl:
                    (
                        info.imageLinks?.extraLarge ||
                        info.imageLinks?.large ||
                        info.imageLinks?.medium ||
                        info.imageLinks?.small ||
                        info.imageLinks?.thumbnail ||
                        prev.coverUrl
                    )?.replace('&zoom=1', '&zoom=2'),
            }))

        } catch (error) {

            setForm(prev => ({
                ...prev,
                isbn: ''
            }))

            if (error.name === 'AbortError') {
                console.error('Google Books lookup timed out')
                setLookupMessage('Google Books 查询超时，请稍后再试')
            } else {
                console.error('Google Books lookup error:', error)
                setLookupMessage('查询 Google Books 失败，please try again')
            }
        } finally {
            clearTimeout(timeoutId)
            setLookingUpISBN(false)
        }
    }

    useEffect(() => {
        if (!scanningISBN) {
            scannerControlsRef.current?.stop()
            scannerControlsRef.current = null
            return
        }

        let cancelled = false

        const startScanner = async () => {
            try {
                const reader = new BrowserMultiFormatReader()

                const controls = await reader.decodeFromConstraints(
                    {
                        audio: false,
                        video: {
                            facingMode: { ideal: 'environment' },
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                            focusMode: 'continuous'
                        }
                    },
                    videoRef.current,
                    (result, error) => {
                        if (result) {
                            const value = result.getText()

                            console.log('ISBN barcode detected:', value)
                            console.log('Starting automatic Google Books lookup:', value)

                            setDetectedISBN(value)

                            setForm(prev => ({
                                ...prev,
                                isbn: value
                            }))

                            setScanningISBN(false)

                            lookupISBN(value)

                            setTimeout(() => {
                                setDetectedISBN('')
                            }, 3000)
                        }
                    }
                )

                if (cancelled) {
                    controls.stop()
                } else {
                    scannerControlsRef.current = controls
                }

            } catch (error) {
                console.error('Barcode scanner error:', error)

                if (!cancelled) {
                    setLookupMessage(`无法启动摄像头：${error.message}`)
                    setScanningISBN(false)
                }
            }
        }

        startScanner()

        return () => {
            cancelled = true
            scannerControlsRef.current?.stop()
            scannerControlsRef.current = null
        }
    }, [scanningISBN])

    useEffect(() => {
        console.log('scanningISBN:', scanningISBN)
    }, [scanningISBN])

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
            publisher: initialData.publisher || '',
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

    const scanISBNFromImage = async (file) => {
        if (!file) return

        try {
            const reader = new BrowserMultiFormatReader()

            const imageUrl = URL.createObjectURL(file)

            const result = await reader.decodeFromImageUrl(imageUrl)

            const value = result.getText()

            setForm(prev => ({
                ...prev,
                isbn: value
            }))

            setScanningISBN(false)

            lookupISBN(value)

            URL.revokeObjectURL(imageUrl)

        } catch (error) {
            console.error('ISBN image scan error:', error)

            setForm(prev => ({
                ...prev,
                isbn: ''
            }))

            setLookupMessage('无法从图片中找到 ISBN 条码')
        }
    }

    const loadSuggestions = async () => {
        const { data, error } = await supabase
            .from('books')
            .select(`
            edition,
            publisher,
            updated_at,
            series:book_series!inner (
                title,
                author,
                subcategory,
                updated_at
            )
        `)
            .eq('series.subcategory', form.subcategory)

        if (error) {
            console.error('Error loading book suggestions:', error)
            return
        }

        const getSuggestions = (getValue) => {
            const latestByValue = new Map()

            for (const book of data || []) {
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
                .map((item) => item.value)
        }

        setSuggestions({
            title: getSuggestions(
                (book) => book.series?.title
            ),

            author: getSuggestions(
                (book) => book.series?.author
            ),

            edition: getSuggestions(
                (book) => book.edition
            ),

            publisher: getSuggestions(
                (book) => book.publisher
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

        const parsedVolumes = parseBatchVolumes(form.volume)

        if (!parsedVolumes || parsedVolumes.length === 0) {
            alert('请输入有效的集数，例如：1 ,2 ,3 ,全 或 1-5 ,8 ,11-13')
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

            {(saving || lookingUpISBN) && (
                <div className="saving-overlay">
                    <div className="saving-message">
                        <Loading
                            text={saving ? '保存中' : '查询中'}
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

            {scanningISBN && (
                <div className="isbn-scanner">

                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{
                            width: '100%',
                            maxWidth: '400px',
                            aspectRatio: '3 / 1.3',
                            objectFit: 'cover',
                            display: 'block',
                            marginTop: '10px'
                        }}
                    />

                    <div className="isbn-scan-guide">
                        <div className="isbn-scan-frame" />
                        <p>请将 ISBN 条码放入框内</p>
                    </div>

                    <button
                        type="button"
                        className="cancel-scan-button"
                        onClick={() => setScanningISBN(false)}
                    >
                        取消扫描
                    </button>

                </div>
            )}

            {detectedISBN && (
                <div className="isbn-detected-message">
                    已检测到 ISBN：{detectedISBN}
                </div>
            )}

            {lookupMessage && (
                <div className="isbn-detected-message isbn-lookup-error">
                    {lookupMessage}
                </div>
            )}

            {isbnLookupError && (
                <div className="isbn-detected-message isbn-lookup-error">
                    {isbnLookupError}
                </div>
            )}

            <div className="form-field">
                <label htmlFor="isbn">ISBN</label>

                <div className="isbn-input-row">

                    <div className="isbn-input-group">
                        <input
                            id="isbn"
                            name="isbn"
                            type="text"
                            autoComplete="off"
                            placeholder="请输入 ISBN"
                            value={form.isbn}
                            onChange={handleChange}
                        />

                        <button
                            type="button"
                            className="isbn-icon-button"
                            onClick={() => setScanningISBN(prev => !prev)}
                            title={scanningISBN ? '关闭扫描' : '扫描 ISBN'}
                            aria-label={scanningISBN ? '关闭扫描' : '扫描 ISBN'}
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                    d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M8 9h8v6H8z"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                                <path
                                    d="M10 12h4"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>

                        <label
                            className="isbn-icon-button"
                            title="从相册选择"
                            aria-label="从相册选择"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="16"
                                    rx="2"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                                <circle
                                    cx="8.5"
                                    cy="9"
                                    r="1.5"
                                    fill="currentColor"
                                />
                                <path
                                    d="M3 17l5-5 3 3 2-2 5 5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => {
                                    scanISBNFromImage(e.target.files?.[0])
                                    e.target.value = ''
                                }}
                            />
                        </label>
                    </div>

                    <button
                        type="button"
                        className="google-books-button"
                        onClick={() => lookupISBN()}
                        disabled={lookingUpISBN}
                    >
                        Google Books 查询
                    </button>

                </div>
            </div>

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
                <label htmlFor="volume">集数</label>

                <input
                    id="volume"
                    name="volume"
                    type="text"
                    placeholder="例如：1, 2, 3,全 或 1-5, 8, 11-13"
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