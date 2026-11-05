import './App.css'

// Configure the Router
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import ManageSlots from './pages/ManageSlots'
import Register from './pages/Register'
import { STAFF_ROLES } from './utils/roles'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* MH-02: employees (and the warden) define slot capacity */}
        <Route
          path="/slots"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <ManageSlots />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
