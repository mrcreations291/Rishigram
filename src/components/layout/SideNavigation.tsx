import { Home, Search, Play, Heart, MessageCircle, User, LogOut, PlusSquare, Bookmark, Moon, Sun } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export function SideNavigation() {
  const { user, signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  
  return (
    <div className="fixed hidden md:flex flex-col h-full w-64 border-r border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#405DE6] to-[#5851DB] bg-clip-text text-transparent">
          RishiGram
        </h1>
      </div>
      
      <div className="flex-1 flex flex-col py-4">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex items-center px-6 py-3 text-sm font-medium ${
              isActive 
                ? 'text-black dark:text-white bg-gray-100 dark:bg-gray-800' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`
          }
        >
          <Home size={20} className="mr-4" />
          <span>Home</span>
        </NavLink>
        
        <NavLink 
          to="/search" 
          className={({ isActive }) => 
            `flex items-center px-6 py-3 text-sm font-medium ${
              isActive 
                ? 'text-black dark:text-white bg-gray-100 dark:bg-gray-800' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`
          }
        >
          <Search size={20} className="mr-4" />
          <span>Search</span>
        </NavLink>
        
        <NavLink 
          to="/reels" 
          className={({ isActive }) => 
            `flex items-center px-6 py-3 text-sm font-medium ${
              isActive 
                ? 'text-black dark:text-white bg-gray-100 dark:bg-gray-800' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`
          }
        >
          <Play size={20} className="mr-4" />
          <span>Reels</span>
        </NavLink>
        
        <NavLink 
          to="/create" 
          className={({ isActive }) => 
            `flex items-center px-6 py-3 text-sm font-medium ${
              isActive 
                ? 'text-black dark:text-white bg-gray-100 dark:bg-gray-800' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`
          }
        >
          <PlusSquare size={20} className="mr-4" />
          <span>Create</span>
        </NavLink>
        
        <NavLink 
          to="/notifications" 
          className={({ isActive }) => 
            `flex items-center px-6 py-3 text-sm font-medium ${
              isActive 
                ? 'text-black dark:text-white bg-gray-100 dark:bg-gray-800' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`
          }
        >
          <Heart size={20} className="mr-4" />
          <span>Notifications</span>
        </NavLink>
        
        <NavLink 
          to="/messages" 
          className={({ isActive }) => 
            `flex items-center px-6 py-3 text-sm font-medium ${
              isActive 
                ? 'text-black dark:text-white bg-gray-100 dark:bg-gray-800' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`
          }
        >
          <MessageCircle size={20} className="mr-4" />
          <span>Messages</span>
        </NavLink>
        
        <NavLink 
          to="/saved" 
          className={({ isActive }) => 
            `flex items-center px-6 py-3 text-sm font-medium ${
              isActive 
                ? 'text-black dark:text-white bg-gray-100 dark:bg-gray-800' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`
          }
        >
          <Bookmark size={20} className="mr-4" />
          <span>Saved</span>
        </NavLink>
        
        <NavLink 
          to={`/profile/${user?.id}`} 
          className={({ isActive }) => 
            `flex items-center px-6 py-3 text-sm font-medium ${
              isActive 
                ? 'text-black dark:text-white bg-gray-100 dark:bg-gray-800' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`
          }
        >
          <User size={20} className="mr-4" />
          <span>Profile</span>
        </NavLink>
      </div>
      
      <div className="p-6 space-y-2">
        <button 
          onClick={toggleDarkMode}
          className="flex items-center w-full text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
        >
          {darkMode ? <Sun size={20} className="mr-2" /> : <Moon size={20} className="mr-2" />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        
        <button 
          onClick={() => signOut()}
          className="flex items-center w-full text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
        >
          <LogOut size={20} className="mr-2" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}