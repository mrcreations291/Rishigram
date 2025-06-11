import { Home, Search, Play, Heart, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function MobileNavigation() {
  const { user } = useAuth();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden dark:bg-gray-900 dark:border-gray-800">
      <div className="flex justify-around items-center h-16">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`
          }
        >
          <Home size={24} />
        </NavLink>
        
        <NavLink 
          to="/search" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`
          }
        >
          <Search size={24} />
        </NavLink>
        
        <NavLink 
          to="/reels" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`
          }
        >
          <Play size={24} />
        </NavLink>
        
        <NavLink 
          to="/notifications" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`
          }
        >
          <Heart size={24} />
        </NavLink>
        
        <NavLink 
          to={`/profile/${user?.id}`} 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`
          }
        >
          <User size={24} />
        </NavLink>
      </div>
    </nav>
  );
}