import { useChatChannels } from '@/store/chatChannels'
import ChannelChat from './ChannelChat'

export default function ChatTab() {
  const serverMessages = useChatChannels((s) => s.serverMessages)
  const sendServer     = useChatChannels((s) => s.sendServer)

  return (
    <div className="h-full">
      <ChannelChat
        messages={serverMessages}
        onSend={sendServer}
        placeholder="Message à tous…"
      />
    </div>
  )
}
