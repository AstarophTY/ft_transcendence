import { useEffect } from 'react'

import { useAuth } from '@/store/auth'
import AuthPanel from './AuthPanel'

const HUDFrame = () => {
  const init = useAuth((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <div className="absolute inset-0 z-10 h-full w-full pointer-events-none flex flex-col justify-between p-6">
      <header className="flex items-start justify-end">
        <AuthPanel />
      </header>
    </div>
  )
}

export default HUDFrame
