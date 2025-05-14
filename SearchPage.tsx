import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';

type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  profile_image: string | null;
};

export function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Profile[]>([]);
  const [popularUsers, setPopularUsers] = useState<Profile[]>([]);
  
  // Fetch popular users on initial load
  useEffect(() => {
    async function fetchPopularUsers() {
      // For demo purposes, we'll just get a few users sorted by username
      // In a real app, you might sort by follower count or other popularity metrics
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, profile_image')
        .order('username')
        .limit(10);
        
      if (!error && data) {
        setPopularUsers(data);
      }
    }
    
    fetchPopularUsers();
  }, []);
  
  // Search users when query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length === 0) {
        setResults([]);
        return;
      }
      
      setIsSearching(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, profile_image')
        .ilike('username', `%${searchQuery}%`)
        .order('username')
        .limit(20);
        
      setIsSearching(false);
      
      if (!error && data) {
        setResults(data);
      }
    }, 300);
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Search</h1>
      
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search for users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          icon={<Search size={18} className="text-gray-500 dark:text-gray-400" />}
        />
      </div>
      
      {isSearching ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="rounded-full bg-gray-200 h-12 w-12 dark:bg-gray-700"></div>
              <div className="ml-3 flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2 dark:bg-gray-700"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 dark:bg-gray-700"></div>
              </div>
            </div>
          ))}
        </div>
      ) : searchQuery.trim().length > 0 ? (
        <div>
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map(profile => (
                <Link 
                  key={profile.id} 
                  to={`/profile/${profile.id}`}
                  className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <Avatar 
                    src={profile.profile_image} 
                    username={profile.username}
                    size="md"
                  />
                  <div className="ml-3">
                    <p className="font-semibold">{profile.username}</p>
                    {profile.full_name && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{profile.full_name}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <User size={48} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No users found</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Try searching for a different username
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-4">Suggested Users</h2>
          <div className="space-y-2">
            {popularUsers.map(profile => (
              <Link 
                key={profile.id} 
                to={`/profile/${profile.id}`}
                className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <Avatar 
                  src={profile.profile_image} 
                  username={profile.username}
                  size="md"
                />
                <div className="ml-3">
                  <p className="font-semibold">{profile.username}</p>
                  {profile.full_name && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{profile.full_name}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}