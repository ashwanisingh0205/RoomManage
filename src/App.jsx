


import './App.css'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import ProtectedRoute from './components/ui/protected'

function App() {
 

  return (
   <Routes>
    <Route path='/' element={<Login />} />
    <Route path='/login' element={<Login />} />
    {/* <Route path='/home' element={<ProtectedRoute><Home /></ProtectedRoute>} /> */}
    <Route path='/home' element={<Home />} />
   </Routes>
  )
}

export default App
