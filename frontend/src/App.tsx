import './App.css'

// Configure the Router
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import GetTicket from './pages/GetTicket'
import Home from './pages/Home'
import Login from './pages/Login'
import SeeStats from './pages/SeeStats'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/get-ticket" element={<GetTicket />} />
        <Route path="/see-stats" element={
          <ProtectedRoute>
              <SeeStats />
          </ProtectedRoute>
        }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
