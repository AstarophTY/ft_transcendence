import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
// import { Users, UserPlus, MessageSquare, Settings } from 'lucide-react';
import UserIcon from '@/components/hud/UserIcon';
// import { Tab } from "@/types/Social"


export default function SocialPanel() {
  // const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [isOpen, setIsOpen] = useState(false);

  // const tabs = [
  //   { id: 'friends' as Tab, icon: Users, label: 'Social' },
  //   { id: 'add' as Tab, icon: UserPlus, label: 'Add Friend' },
  //   { id: 'chat' as Tab, icon: MessageSquare, label: 'Chat' },
  //   { id: 'settings' as Tab, icon: Settings, label: 'Settings' }
  // ];

  return (
    <>
      <div className="absolute top-4 right-4 pointer-events-auto z-50">
        <UserIcon onClick={() => setIsOpen(!isOpen)} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 0, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute top-4 w-80 h-[80vh] bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto border border-slate-700/50"
          >
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
