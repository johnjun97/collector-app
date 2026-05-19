import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}

// function App() {
//   return (
//     <div>
//       <h1>Collector</h1>
//     </div>
//   )
// }

// export default App


