import './App.css'

// Configure the Router
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import BookTable from './pages/BookTable'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* MH-01, public for now */}
        <Route path="/book" element={<BookTable />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
