import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import './Books.css'

export default function Books() {
    const navigate = useNavigate()

    return (
        <>
            <Navbar section="书籍" />

            <main className="books-page">
                <div className="books-header">
                    <h1>My Books</h1>

                    <button
                        className="add-book-button"
                        onClick={() => navigate('/books/new')}
                    >
                        + Add Book
                    </button>
                </div>

                <p>No books yet.</p>
            </main>
        </>
    )
}
