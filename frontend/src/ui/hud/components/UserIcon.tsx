import { UserIconProps } from "@/types/User";

export default function UserIcon({ 
  imageUrl = "https://ui-avatars.com/api/?name=User&background=random", 
  status = 'online', 
  onClick 
}: UserIconProps) {
  
  const statusColors = {
    online: 'bg-green-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500'
  };

  return (
    <button 
      onClick={onClick} 
      className="relative cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-transform hover:scale-105"
    >
      <img 
        src={imageUrl} 
        alt="User Avatar" 
        className="w-12 h-12 rounded-full object-cover border-5 border-gray-900/50"
      />
      <span 
        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-gray-800 ${statusColors[status]}`}
        title={`Status: ${status}`}
      />
    </button>
  );
}
