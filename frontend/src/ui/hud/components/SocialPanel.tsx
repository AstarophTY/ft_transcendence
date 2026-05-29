import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, UserPlus, MessageSquare, Settings } from 'lucide-react';
import UserIcon from '@/ui/hud/components/UserIcon';
import { Tab } from "@/types/Social"


export default function SocialPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [isOpen, setIsOpen] = useState(false);

  const tabs = [
    { id: 'friends' as Tab, icon: Users, label: 'Social' },
    { id: 'add' as Tab, icon: UserPlus, label: 'Add Friend' },
    { id: 'chat' as Tab, icon: MessageSquare, label: 'Chat' },
    { id: 'settings' as Tab, icon: Settings, label: 'Settings' }
  ];

  return (
    <>
      <div className="absolute top-4 right-4 pointer-events-auto z-50">
        <UserIcon onClick={() => setIsOpen(!isOpen)} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute top-4 right-20 w-80 h-[80vh] bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto border border-slate-700/50"
          >
            <div className="flex items-center justify-between px-2 py-3 bg-slate-800/50 border-b border-slate-700/50">
              <div className="flex space-x-1 w-full justify-around">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative p-2 rounded-lg transition-colors flex flex-col items-center justify-center
                        ${isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                      title={tab.label}
                    >
                      <Icon size={20} className={isActive ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''} />
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute -bottom-1 w-full h-0.5 bg-blue-500 rounded-t-full"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto w-full relative">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 p-4"
                >
                  <h2 className="text-xl font-bold text-white mb-4">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h2>
                  <div className="text-slate-400">
                    Content for {activeTab} goes here...
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
