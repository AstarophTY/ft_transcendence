import { useEffect, useState } from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

  useEffect(() => {
    const el = document.documentElement
    const updateTheme = () =>
      setTheme(el.classList.contains('dark') ? 'dark' : 'light')

    updateTheme()
    const observer = new MutationObserver(updateTheme)
    observer.observe(el, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position="top-center"
      richColors
      {...props}
    />
  )
}
