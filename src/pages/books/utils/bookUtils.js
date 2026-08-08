export function buildBooksBySeries(addedBooks, allBooks, seriesIds) {
    return seriesIds
        .map((seriesId) => {
            const seriesBooks = allBooks.filter(
                (book) => book.series_id === seriesId
            )


            const addedSeriesBooks = addedBooks.filter(
                (book) => book.series_id === seriesId
            )

            if (seriesBooks.length === 0) {
                return null
            }

            const series = seriesBooks[0].series

            // Sort volumes
            const sortedVolumes = [...seriesBooks].sort((a, b) => {
                const aNum = Number(a.volume)
                const bNum = Number(b.volume)

                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return aNum - bNum
                }

                if (!isNaN(aNum)) return -1
                if (!isNaN(bNum)) return 1

                return String(a.volume).localeCompare(
                    String(b.volume)
                )
            })

            const addedVolumes = addedSeriesBooks.map(
                (book) => String(book.volume)
            )

            const ownedBookIds = new Set(
                addedSeriesBooks
                    .filter((book) => book.isOwned)
                    .map((book) => book.id)
            )

            const numericVolumes = sortedVolumes
                .map((book) => Number(book.volume))
                .filter(
                    (volume) =>
                        Number.isInteger(volume) && volume > 0
                )

            const latestVolume =
                numericVolumes.length > 0
                    ? Math.max(...numericVolumes)
                    : 0

            const visibleVolumes = []

            // Numeric volumes: 1, 2, 3...
            for (let i = 1; i <= latestVolume; i++) {
                const existingVolumes = sortedVolumes.filter(
                    (book) => Number(book.volume) === i
                )

                if (existingVolumes.length > 0) {
                    for (const volume of existingVolumes) {
                        const isSpecialEdition =
                            volume.edition &&
                            volume.edition !== '普通版'

                        // 普通版：一直显示
                        if (!isSpecialEdition) {
                            visibleVolumes.push(volume)
                        }

                        // 特装版：只有用户入手才显示
                        else if (ownedBookIds.has(volume.id)) {
                            visibleVolumes.push(volume)
                        }
                    }
                } else {
                    // Volume doesn't exist in Supabase yet
                    visibleVolumes.push({
                        id: `placeholder-${seriesId}-${i}`,
                        volume: String(i),
                        edition: '普通版',
                        isPlaceholder: true,
                    })
                }
            }

            // Text volumes: 全、上、下
            const textVolumes = sortedVolumes.filter(
                (book) =>
                    ['全', '上', '下'].includes(String(book.volume))
            )

            for (const volume of textVolumes) {
                const isSpecialEdition =
                    volume.edition &&
                    volume.edition !== '普通版'

                // 普通版：一直显示
                if (!isSpecialEdition) {
                    visibleVolumes.push(volume)
                }

                // 特装版：只有用户入手才显示
                else if (ownedBookIds.has(volume.id)) {
                    visibleVolumes.push(volume)
                }
            }

            const latestBook =
                sortedVolumes[sortedVolumes.length - 1]

            return {
                id: series.id,
                title: series.title,
                author: series.author,
                subcategory: series.subcategory,
                cover_image: series.cover_image,
                cover_image_url: series.cover_image_url,
                allVolumes: visibleVolumes,
                ownedBookIds,
                addedVolumes,
                latestBook,
            }
        })
        .filter(Boolean)
        .sort((a, b) => {
            const aDate = Math.max(
                ...a.allVolumes
                    .filter((book) => !book.isPlaceholder)
                    .map((book) => new Date(book.updated_at).getTime())
            )

            const bDate = Math.max(
                ...b.allVolumes
                    .filter((book) => !book.isPlaceholder)
                    .map((book) => new Date(book.updated_at).getTime())
            )

            return bDate - aDate
        })
}