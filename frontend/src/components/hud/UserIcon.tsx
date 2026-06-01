import { UserIconProps } from "@/types/User";
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from "@/components/shadcn/avatar"

export default function UserIcon({ 
  imageUrl = "", 
  status = 'online', 
  onClick
}: UserIconProps) {
  
  const statusColors = {
    online: 'bg-green-500 dark:bg-green-600',
    dnd: 'bg-red-500 dark:bg-red-600',
    offline: 'bg-slate-400 dark:bg-slate-500'
  };

  return (
    <Avatar className="cursor-pointer" onClick={onClick}>
      <AvatarImage src={imageUrl} alt={status} />
      <AvatarFallback>U</AvatarFallback>
      <AvatarBadge className={statusColors[status]} />
    </Avatar>
  );
}
