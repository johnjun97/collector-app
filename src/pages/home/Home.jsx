import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Navbar from '../../components/Navbar'
import Loading from '../../components/Loading'
import ContributionCard from './ContributionCard/ContributionCard'
import BookProgressCard from './BookProgressCard/BookProgressCard'
import './Home.css'

export default function Home() {

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [bookStats, setBookStats] = useState({
    total: 0,
    owned: 0
  })

  const [contributionStats, setContributionStats] = useState({
    total: 0,
    created: 0,
    updated: 0,
    deleted: 0
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

      // 3. Calculate books belonging to series added by the user

      const userBookIds = new Set(
        userBooks.map(book => book.book_id)
      )

      const userSeriesIds = new Set(
        allBooks
          .filter(book => userBookIds.has(book.id))
          .map(book => book.series_id)
      )

      const userSeriesBooks = allBooks.filter(
        book => userSeriesIds.has(book.series_id)
      )

      const totalCount = userSeriesBooks.length

      const ownedBookIds = new Set(
        userBooks
          .filter(book => book.is_owned)
          .map(book => book.book_id)
      )

      const ownedCount = userSeriesBooks.filter(
        book => ownedBookIds.has(book.id)
      ).length

      // 4. Set book statistics
      setBookStats({
        total: totalCount,
        owned: ownedCount
      })

      // 5. Get current user's contributions
      const { data: contributions, error: contributionsError } =
        await supabase
          .from('contributions')
          .select('action, points')
          .eq('user_id', user.id)

      if (contributionsError) {
        console.error(
          'Error loading contributions:',
          contributionsError
        )

        setLoading(false)
        return
      }

      const contributionStats = {
        total: contributions.reduce(
          (sum, contribution) => sum + contribution.points,
          0
        ),

        created: contributions.filter(
          (contribution) => contribution.action === 'create'
        ).length,

        updated: contributions.filter(
          (contribution) => contribution.action === 'update'
        ).length,

        deleted: contributions.filter(
          (contribution) => contribution.action === 'delete'
        ).length
      }

      setContributionStats(contributionStats)

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

        <BookProgressCard
          owned={bookStats.owned}
          total={bookStats.total}
        />

        <ContributionCard stats={contributionStats} />

      </main>
    </>
  )
}