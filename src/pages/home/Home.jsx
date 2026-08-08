import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Navbar from '../../components/Navbar'
import Loading from '../../components/Loading'
import './Home.css'

export default function Home() {

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [bookStats, setBookStats] = useState({
    total: 0,
    owned: 0
  })

  const [userBookStats, setUserBookStats] = useState({
    total: 0,
    owned: 0
  })

  const [seriesStats, setSeriesStats] = useState([])

  useEffect(() => {

    const getDashboardData = async () => {

      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      setUser(user)

      // 1. Get ALL books in Supabase
      const { data: allBooks, error: allBooksError } =
        await supabase
          .from('books')
          .select(`
                        id,
                        series_id,
                        series:book_series (
                            title,
                            subcategory
                        )
                    `)

      if (allBooksError) {
        console.error(
          'Error loading all books:',
          allBooksError
        )
        setLoading(false)
        return
      }

      // 2. Get current user's books
      const { data: userBooks, error: userBooksError } =
        await supabase
          .from('user_books')
          .select(`
                        book_id,
                        is_owned
                    `)
          .eq('user_id', user.id)

      if (userBooksError) {
        console.error(
          'Error loading user books:',
          userBooksError
        )
        setLoading(false)
        return
      }

      // -----------------------------
      // Statistic 1
      // ALL books vs OWNED
      // -----------------------------

      const ownedCount = userBooks.filter(
        (book) => book.is_owned
      ).length

      setUserBookStats({
        total: userBooks.length,
        owned: ownedCount
      })

      setBookStats({
        total: allBooks.length,
        owned: ownedCount
      })


      // -----------------------------
      // Statistic 2
      // User's books: owned vs total
      // -----------------------------

      const userBookIds = new Set(
        userBooks.map((book) => book.book_id)
      )

      const userBookDetails = allBooks.filter((book) =>
        userBookIds.has(book.id)
      )

      const seriesMap = new Map()

      for (const book of userBookDetails) {

        const seriesId = book.series_id

        if (!seriesId || !book.series) continue

        if (!seriesMap.has(seriesId)) {
          seriesMap.set(seriesId, {
            id: seriesId,
            title: book.series.title,
            subcategory: book.series.subcategory,
            total: 0,
            owned: 0
          })
        }

        const series = seriesMap.get(seriesId)

        // Total books registered in user's collection
        series.total += 1

        const userBook = userBooks.find(
          (item) => item.book_id === book.id
        )

        if (userBook?.is_owned) {
          series.owned += 1
        }
      }

      setSeriesStats(
        [...seriesMap.values()]
          .filter((series) => series.total > 0)
      )
      setLoading(false)
    }

    getDashboardData()

  }, [])

  if (loading) {
    return <Loading />
  }

  return (
    <>
      <Navbar section="首页" />

      <main className="home-page">

        <div className="home-header">
          <h1>Dashboard</h1>

          <p>
            Welcome,{' '}
            {user?.user_metadata?.displayName ||
              user?.email}
          </p>
        </div>


        {/* Statistic 1 */}
        <details className="dashboard-card" open>

          <summary className="dashboard-card-header">
            <div>
              <h2>所有书籍</h2>
              <span>
                {bookStats.owned} / {bookStats.total} ({bookStats.total ? Math.round((bookStats.owned / bookStats.total) * 100) : 0}%)
              </span>
            </div>

            <span className="expand-icon">
              +
            </span>
          </summary>

          <div className="progress-container">
            <div
              className="progress-bar"
              style={{
                width: `${bookStats.total
                  ? (bookStats.owned / bookStats.total) * 100
                  : 0
                  }%`
              }}
            />
          </div>


          {/* Statistic 2 inside Statistic 1 */}
          <details className="collection-section" open>

            <summary className="collection-header">
              <div>
                <h3>我的收藏</h3>

                <span>
                  {userBookStats.owned} / {userBookStats.total} ({userBookStats.total ? Math.round((userBookStats.owned / userBookStats.total) * 100) : 0}%)
                </span>
              </div>

              <span className="expand-icon">
                +
              </span>
            </summary>


            <div className="series-list">

              {seriesStats.length === 0 ? (

                <p className="empty-message">
                  还没有收藏书籍
                </p>

              ) : (

                seriesStats.map((series) => {

                  const percentage = series.total
                    ? (series.owned / series.total) * 100
                    : 0

                  return (
                    <div
                      key={series.id}
                      className="series-stat"
                    >

                      <div className="series-info">

                        <div>
                          <strong>
                            {series.title}
                          </strong>

                          <span>
                            {series.subcategory}
                          </span>
                        </div>

                        <strong>
                          {series.owned} / {series.total} ({Math.round(percentage)}%)
                        </strong>

                      </div>


                      <div className="progress-container series-progress">
                        <div
                          className="progress-bar"
                          style={{
                            width: `${percentage}%`
                          }}
                        />
                      </div>

                    </div>
                  )
                })

              )}

            </div>

          </details>

        </details>

      </main>
    </>
  )
}

