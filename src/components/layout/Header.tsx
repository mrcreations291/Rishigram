import { Search, Heart, MessageCircle, LogOut, Camera, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function Header() {
  const { signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 md:hidden dark:bg-gray-900 dark:border-gray-800">
      <div className="h-full flex items-center justify-between px-4">
        <Link to="/" className="font-bold text-xl bg-gradient-to-r from-[#405DE6] to-[#5851DB] bg-clip-text text-transparent">
          RishiGram
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link to="/stories/create" className="text-gray-800 dark:text-gray-200">
            <Camera size={24} />
          </Link>
          
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-800 dark:text-gray-200"
          >
            <Menu size={24} />
          </button>
        </div>
        
        {menuOpen && (
          <div className="absolute top-16 right-0 w-48 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <Link 
              to="/search" 
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => setMenuOpen(false)}
            >
              <Search size={18} className="mr-2" />
              <span>Search</span>
            </Link>
            
            <Link 
              to="/activity" 
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => setMenuOpen(false)}
            >
              <Heart size={18} className="mr-2" />
              <span>Activity</span>
            </Link>
            
            <Link 
              to="/messages" 
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => setMenuOpen(false)}
            >
              <MessageCircle size={18} className="mr-2" />
              <span>Messages</span>
            </Link>
            
            <button 
              onClick={() => {
                signOut();
                setMenuOpen(false);
              }}
              className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <LogOut size={18} className="mr-2" />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}