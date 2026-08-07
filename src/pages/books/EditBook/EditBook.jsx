import { useParams } from 'react-router-dom'

export default function EditBook() {
    const { id } = useParams()

    return (
        <main>
            <h1>Edit Book</h1>
            <p>Book ID: {id}</p>
        </main>
    )
}