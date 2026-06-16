export type Tab = 'friends' | 'chat' | 'requests' | 'settings' | 'add';

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}
