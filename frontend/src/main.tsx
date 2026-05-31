import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './i18n'
import './index.css'

const storedTheme = localStorage.getItem('theme')
if (!storedTheme) {
  document.documentElement.classList.add('dark')
  localStorage.setItem('theme', 'dark')
} else {
  document.documentElement.classList.toggle('dark', storedTheme === 'dark')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
