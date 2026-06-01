export type Tab = 'friends' | 'chat' | 'requests' | 'settings';

export type ConnectionStatus = 'online' | 'dnd' | 'offline';

export interface Friend {
  id: string;
  username: string;
  avatar?: string;
  status: ConnectionStatus;
  statusText?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface FriendRequest {
  id: string;
  username: string;
  avatar?: string;
  incoming: boolean;
}
