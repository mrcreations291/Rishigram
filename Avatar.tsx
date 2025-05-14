import { User } from 'lucide-react';

type AvatarProps = {
  src: string | null;
  username: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hasStory?: boolean;
  viewedStory?: boolean;
  className?: string;
};

export function Avatar({ 
  src, 
  username, 
  size = 'md', 
  hasStory = false,
  viewedStory = false,
  className = '' 
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };
  
  const ringSize = {
    sm: 'p-0.5',
    md: 'p-0.5',
    lg: 'p-[3px]',
    xl: 'p-1'
  };
  
  // Generate initials from username
  const getInitials = () => {
    if (!username) return '';
    return username.charAt(0).toUpperCase();
  };
  
  return (
    <div className={`${className}`}>
      <div className={`
        ${hasStory ? ringSize[size] : ''} 
        ${hasStory && !viewedStory 
          ? 'bg-gradient-to-tr from-[#FCAF45] to-[#C13584] rounded-full' 
          : hasStory && viewedStory 
            ? 'bg-gray-300 dark:bg-gray-600 rounded-full' 
            : ''
        }
      `}>
        <div className="rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
          {src ? (
            <img 
              src={src} 
              alt={username}
              className={`${sizeClasses[size]} object-cover`}
            />
          ) : (
            <div className={`${sizeClasses[size]} flex items-center justify-center bg-gray-300 dark:bg-gray-600`}>
              <User className="text-gray-500 dark:text-gray-400" size={size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 28 : 36} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}