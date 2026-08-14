import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Navbar from '../../components/Navbar'
import Loading from '../../components/Loading'
import './Home.css'

export default function Home() {

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [contributionExpanded, setContributionExpanded] = useState(false)

  const [bookStats, setBookStats] = useState({
    total: 0,
    owned: 0
  })

  const [contributionStats, setContributionStats] = useState({
    createdBookSeries: 0,
    updatedBookSeries: 0,
    createdBooks: 0,
    updatedBooks: 0,
    uploadedCoverImage: 0
  })

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

      // 3. Calculate user's added books
      const totalCount = userBooks.length

      const ownedCount = userBooks.filter(
        (book) => book.is_owned
      ).length

      // 4. Get user's contribution counts
      const [
        { count: createdBookSeries },
        { count: updatedBookSeries },
        { count: createdBooks },
        { count: updatedBooks },
        { count: uploadedCoverImage }
      ] = await Promise.all([
        supabase
          .from('book_series')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', user.id),

        supabase
          .from('book_series')
          .select('id', { count: 'exact', head: true })
          .eq('updated_by', user.id),

        supabase
          .from('books')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', user.id),

        supabase
          .from('books')
          .select('id', { count: 'exact', head: true })
          .eq('updated_by', user.id),

        supabase
          .from('books')
          .select('id', { count: 'exact', head: true })
          .eq('cover_image_updated_by', user.id)
      ])

      setContributionStats({
        createdBookSeries: createdBookSeries ?? 0,
        updatedBookSeries: updatedBookSeries ?? 0,
        createdBooks: createdBooks ?? 0,
        updatedBooks: updatedBooks ?? 0,
        uploadedCoverImage: uploadedCoverImage ?? 0
      })

      // 5. Set ALL books statistics
      setBookStats({
        total: allBooks.length,
        owned: ownedCount
      })

      setLoading(false)
    }

    getDashboardData()

  }, [])

  if (loading) {
    return <Loading text="Loading" />
  }

  return (
    <>
      <Navbar />

      <main className="home-page">

        <div className="home-header">
          <h1>Dashboard</h1>

          <p>
            Welcome,{' '}
            {user?.user_metadata?.displayName ||
              user?.email}
          </p>
        </div>

        <div className="dashboard-card">

          <div className="dashboard-card-header">
            <div>
              <h2>所有书籍</h2>

              <span>
                {bookStats.owned} / {bookStats.total} (
                {bookStats.total
                  ? Math.round(
                    (bookStats.owned / bookStats.total) * 100
                  )
                  : 0
                }%)
              </span>
            </div>
          </div>

          <div className="progress-container">
            <div
              className="progress-bar progress-animate"
              style={{
                width: `${bookStats.total
                  ? (bookStats.owned / bookStats.total) * 100
                  : 0
                  }%`
              }}
            />
          </div>

        </div>

        <div className="dashboard-card">

          <div className="dashboard-card contribution-card">

            <button
              className="dashboard-card-header contribution-header"
              onClick={() =>
                setContributionExpanded(!contributionExpanded)
              }
            >
              <div>
                <h2>贡献</h2>

                <span>
                  Total contribution point = {
                    contributionStats.createdBookSeries +
                    contributionStats.updatedBookSeries +
                    contributionStats.createdBooks +
                    contributionStats.updatedBooks +
                    contributionStats.uploadedCoverImage
                  }
                </span>
              </div>

              <span className="contribution-arrow">
                {contributionExpanded ? '▲' : '▼'}
              </span>
            </button>

            {contributionExpanded && (
              <div className="contribution-list">

                <div>
                  <span>Created book_series</span>
                  <strong>{contributionStats.createdBookSeries}</strong>
                </div>

                <div>
                  <span>Last updated book_series</span>
                  <strong>{contributionStats.updatedBookSeries}</strong>
                </div>

                <div>
                  <span>Created books</span>
                  <strong>{contributionStats.createdBooks}</strong>
                </div>

                <div>
                  <span>Last updated books</span>
                  <strong>{contributionStats.updatedBooks}</strong>
                </div>

                <div>
                  <span>Last uploaded cover image</span>
                  <strong>{contributionStats.uploadedCoverImage}</strong>
                </div>

              </div>
            )}

          </div>
        </div>
      </main>
    </>
  )
}

