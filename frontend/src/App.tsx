import './App.css'

// Configure the Router
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import BookTable from './pages/BookTable'
import Home from './pages/Home'
import Login from './pages/Login'
import ManageSlots from './pages/ManageSlots'
import Register from './pages/Register'
import { BOOK_TABLE_ROLES, MANAGE_SLOTS_ROLES } from './utils/roles'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* MH-01: only hikers can book a table */}
        <Route
          path="/book"
          element={
            <ProtectedRoute allowedRoles={BOOK_TABLE_ROLES}>
              <BookTable />
            </ProtectedRoute>
          }
        />
        {/* MH-02: only employees define slot capacity */}
        <Route
          path="/slots"
          element={
            <ProtectedRoute allowedRoles={MANAGE_SLOTS_ROLES}>
              <ManageSlots />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
