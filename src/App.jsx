import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isSetupDone } from './db/database'

import SetupPage from './pages/SetupPage'
import HomePage from './pages/HomePage'

function AppRouter() {
  const [setupDone, setSetupDone] = useState(null)

  useEffect(() => {
    isSetupDone().then(done => setSetupDone(done))
  }, [])

  if (setupDone === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-p1 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="*" element={<Navigate to={setupDone ? '/home' : '/setup'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
