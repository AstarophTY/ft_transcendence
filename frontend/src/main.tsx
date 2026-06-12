import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AppErrorBoundary } from './ui/pages/AppErrorBoundary.tsx'
import NotFound from './ui/pages/NotFound.tsx'
import './i18n'
import './index.css'

const storedTheme = localStorage.getItem('theme')
if (!storedTheme) {
  document.documentElement.classList.add('dark')
  localStorage.setItem('theme', 'dark')
} else {
  document.documentElement.classList.toggle('dark', storedTheme === 'dark')
}

// The app is a single-page experience served entirely from `/`; the 42 OAuth
// round-trip also returns to `/`. Any other path is a genuine 404.
const isKnownPath = window.location.pathname === '/'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>{isKnownPath ? <App /> : <NotFound />}</AppErrorBoundary>
  </React.StrictMode>,
)
