import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import Avatar from '@/ui/hud/friends/Avatar.tsx'

interface RequestRowProps {
  name: string
  avatar: string | null
  actions: ReactNode
}

export default function RequestRow({ name, avatar, actions }: RequestRowProps) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 rounded-xl p-2 hover:bg-accent"
    >
      <Avatar src={avatar} name={name} />
      <span className="flex-1 truncate">{name}</span>
      <div className="flex items-center gap-1">{actions}</div>
    </motion.li>
  )
}
