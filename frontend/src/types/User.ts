export type ConnectionStatus = 'online' | 'dnd' | 'offline';

export interface UserIconProps {
  imageUrl?: string;
  status?: ConnectionStatus;
  onClick?: () => void;
}
