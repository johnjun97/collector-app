import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { supabase } from '../../lib/supabaseClient'
import OpenCC from 'opencc-js'
import './ISBNLookup.css'

const converter = OpenCC.Converter({
    from: 'tw',
    to: 'cn'
})

export default function ISBNLookup({
    isbn,
    onISBNChange,
    onBookData,
}) {
    const [scanningISBN, setScanningISBN] = useState(false)
    const [lookingUpISBN, setLookingUpISBN] = useState(false)

    const [detectedISBN, setDetectedISBN] = useState('')
    const [lookupMessage, setLookupMessage] = useState('')
    const [lookupError, setLookupError] = useState('')

    const videoRef = useRef(null)
    const scannerControlsRef = useRef(null)

    const lookupISBN = async (isbnValue = isbn) => {
        const value = isbnValue.trim()

        setLookupMessage('')
        setLookupError('')

        if (!value) {
            setLookupMessage('请输入 ISBN')
            return
        }

        setLookingUpISBN(true)

        const controller = new AbortController()

        const timeoutId = setTimeout(() => {
            controller.abort()
        }, 10000)

        try {
            const apiKey =
                import.meta.env.VITE_GOOGLE_BOOKS_API_KEY

            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(value)}&key=${apiKey}`,
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
                onISBNChange('')
                setLookupMessage(
                    'Google Books: Books not found'
                )
                return
            }

            const info = data.items[0].volumeInfo

            const apiAuthor =
                info.authors?.join(', ') || ''

            let authorName = apiAuthor

            if (apiAuthor) {
                const {
                    data: authorAlias,
                    error: authorAliasError
                } = await supabase
                    .from('author_aliases')
                    .select('chinese_name')
                    .eq('source_name', apiAuthor)
                    .maybeSingle()

                if (authorAliasError) {
                    console.error(
                        'Author alias lookup error:',
                        authorAliasError
                    )
                }

                if (authorAlias) {
                    authorName =
                        authorAlias.chinese_name
                }
            }

            const rawTitle = info.title || ''
            const rawSubtitle = info.subtitle || ''

            const combinedTitle = rawSubtitle
                ? `${rawTitle} ${rawSubtitle}`
                : rawTitle

            const volumeMatch =
                combinedTitle.match(
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
                setLookupError(
                    `Google Books 未提供：${missingInfo.join('、')}`
                )
            }

            const isbn13 =
                info.industryIdentifiers?.find(
                    item =>
                        item.type === 'ISBN_13'
                )?.identifier || ''

            const isbn10 =
                info.industryIdentifiers?.find(
                    item =>
                        item.type === 'ISBN_10'
                )?.identifier || ''

            const publishedDate =
                (() => {
                    const date =
                        info.publishedDate

                    if (!date) return ''

                    if (/^\d{4}$/.test(date)) {
                        return `${date}-01-01`
                    }

                    if (/^\d{4}-\d{2}$/.test(date)) {
                        return `${date}-01`
                    }

                    return date.slice(0, 10)
                })()

            const coverUrl =
                (
                    info.imageLinks?.extraLarge ||
                    info.imageLinks?.large ||
                    info.imageLinks?.medium ||
                    info.imageLinks?.small ||
                    info.imageLinks?.thumbnail ||
                    ''
                ).replace(
                    '&zoom=1',
                    '&zoom=2'
                )

            const bookData = {
                isbn: isbn13 || isbn10 || value,

                title:
                    converter(cleanTitle),

                volume,

                author:
                    converter(authorName),

                publisher:
                    converter(
                        info.publisher || ''
                    ),

                releaseDate:
                    publishedDate,

                coverUrl
            }

            onBookData(bookData)

        } catch (error) {

            if (error.name === 'AbortError') {
                setLookupMessage(
                    'Google Books 查询超时，请稍后再试'
                )
            } else {
                console.error(
                    'Google Books lookup error:',
                    error
                )

                setLookupMessage(
                    '查询 Google Books 失败，请稍后再试'
                )
            }

        } finally {
            clearTimeout(timeoutId)
            setLookingUpISBN(false)
        }
    }

    const scanISBNFromImage = async (file) => {
        if (!file) return

        setLookupMessage('')
        setLookupError('')

        const imageUrl =
            URL.createObjectURL(file)

        try {
            const reader =
                new BrowserMultiFormatReader()

            const result =
                await reader.decodeFromImageUrl(
                    imageUrl
                )

            const value =
                result.getText()

            onISBNChange(value)

            await lookupISBN(value)

        } catch (error) {

            console.error(
                'ISBN image scan error:',
                error
            )

            onISBNChange('')

            setLookupMessage(
                '无法从图片中找到 ISBN 条码'
            )

        } finally {
            URL.revokeObjectURL(imageUrl)
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
                setLookupMessage('')
                setLookupError('')

                const reader =
                    new BrowserMultiFormatReader()

                const controls =
                    await reader.decodeFromConstraints(
                        {
                            audio: false,
                            video: {
                                facingMode: {
                                    ideal: 'environment'
                                },
                                width: {
                                    ideal: 1280
                                },
                                height: {
                                    ideal: 720
                                },
                                focusMode:
                                    'continuous'
                            }
                        },
                        videoRef.current,
                        result => {

                            if (!result) return

                            const value =
                                result.getText()

                            debugLog(
                                'ISBN barcode detected:',
                                value
                            )

                            setDetectedISBN(value)

                            onISBNChange(value)

                            setScanningISBN(false)

                            lookupISBN(value)

                            setTimeout(() => {
                                setDetectedISBN('')
                            }, 3000)
                        }
                    )

                if (cancelled) {
                    controls.stop()
                } else {
                    scannerControlsRef.current =
                        controls
                }

            } catch (error) {

                console.error(
                    'Barcode scanner error:',
                    error
                )

                if (!cancelled) {
                    setLookupMessage(
                        `无法启动摄像头：${error.message}`
                    )

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

    return (
        <>
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

                        <p>
                            请将 ISBN 条码放入框内
                        </p>

                    </div>

                    <button
                        type="button"
                        className="cancel-scan-button"
                        onClick={() =>
                            setScanningISBN(false)
                        }
                    >
                        取消扫描
                    </button>

                </div>
            )}

            {detectedISBN && (
                <div className="isbn-detected-message">
                    已检测到 ISBN：
                    {detectedISBN}
                </div>
            )}

            {lookupMessage && (
                <div className="isbn-detected-message isbn-lookup-error">
                    {lookupMessage}
                </div>
            )}

            {lookupError && (
                <div className="isbn-detected-message isbn-lookup-error">
                    {lookupError}
                </div>
            )}

            <div className="form-field">

                <label htmlFor="isbn">
                    ISBN
                </label>

                <div className="isbn-input-row">

                    <div className="isbn-input-group">

                        <input
                            id="isbn"
                            type="text"
                            autoComplete="off"
                            placeholder="请输入 ISBN"
                            value={isbn}
                            onChange={e =>
                                onISBNChange(
                                    e.target.value
                                )
                            }
                        />

                        <button
                            type="button"
                            className="isbn-icon-button"
                            onClick={() =>
                                setScanningISBN(
                                    prev => !prev
                                )
                            }
                            title={
                                scanningISBN
                                    ? '关闭扫描'
                                    : '扫描 ISBN'
                            }
                            aria-label={
                                scanningISBN
                                    ? '关闭扫描'
                                    : '扫描 ISBN'
                            }
                        >
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
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
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
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
                                onChange={e => {
                                    scanISBNFromImage(
                                        e.target.files?.[0]
                                    )

                                    e.target.value = ''
                                }}
                            />
                        </label>

                    </div>

                    <button
                        type="button"
                        className="google-books-button"
                        onClick={() =>
                            lookupISBN()
                        }
                        disabled={lookingUpISBN}
                    >
                        {lookingUpISBN
                            ? '查询中...'
                            : 'Google Books 查询'}
                    </button>

                </div>

            </div>
        </>
    )
}