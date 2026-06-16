import { useTranslation } from 'react-i18next'
import { useChatChannels } from '@/store/chatChannels.ts'
import ChannelChat from '@/ui/hud/chat/ChannelChat.tsx'

export default function ChatTab() {
  const { t } = useTranslation()
  const serverMessages = useChatChannels((s) => s.serverMessages)
  const sendServer     = useChatChannels((s) => s.sendServer)

  return (
    <div className="h-full">
      <ChannelChat
        messages={serverMessages}
        onSend={sendServer}
        placeholder={t('chat.serverPlaceholder')}
      />
    </div>
  )
}
