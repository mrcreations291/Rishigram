import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';

type StoryUser = {
  id: string;
  username: string;
  profile_image: string | null;
  hasUnseenStory: boolean;
};

export function StoryBar() {
  const { user } = useAuth();
  const [users, setUsers] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    
    async function fetchStoriesUsers() {
      setLoading(true);
      
      // Get users who have posted stories in the last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          profile_image,
          stories!inner (
            id,
            created_at
          )
        `)
        .gt('stories.created_at', oneDayAgo.toISOString())
        .order('stories.created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching stories:', error);
        setLoading(false);
        return;
      }
      
      // Get viewed stories to mark as seen
      const { data: viewedStories } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('user_id', user.id);
      
      const viewedStoryIds = new Set((viewedStories || []).map(v => v.story_id));
      
      // Process users to check if they have unseen stories
      const processedUsers = data?.map(userWithStories => {
        const hasUnseenStory = userWithStories.stories.some(
          (story: any) => !viewedStoryIds.has(story.id)
        );
        
        return {
          id: userWithStories.id,
          username: userWithStories.username,
          profile_image: userWithStories.profile_image,
          hasUnseenStory
        };
      }) || [];
      
      // Add current user to first position
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('id, username, profile_image')
        .eq('id', user.id)
        .single();
      
      if (currentUser) {
        setUsers([
          { 
            ...currentUser, 
            hasUnseenStory: false // Current user's story is always "seen" by themselves
          },
          ...processedUsers.filter(u => u.id !== user.id)
        ]);
      } else {
        setUsers(processedUsers);
      }
      
      setLoading(false);
    }
    
    fetchStoriesUsers();
    
    const channel = supabase
      .channel('stories_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'stories' }, 
        fetchStoriesUsers
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  if (loading) {
    return (
      <div className="flex space-x-4 overflow-x-auto py-4 px-1 no-scrollbar">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="animate-pulse rounded-full bg-gray-200 h-16 w-16 mb-1 dark:bg-gray-700"></div>
            <div className="animate-pulse h-3 bg-gray-200 rounded w-14 dark:bg-gray-700"></div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="flex space-x-4 overflow-x-auto py-4 px-1 no-scrollbar">
      {/* Current user - Add Story */}
      {user && (
        <Link to="/stories/create" className="flex flex-col items-center">
          <div className="relative">
            <Avatar 
              src={users[0]?.profile_image} 
              username={users[0]?.username || ''}
              size="lg"
            />
            <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 border-2 border-white dark:border-gray-900">
              <Plus size={14} className="text-white" />
            </div>
          </div>
          <span className="text-xs mt-1 text-center text-gray-800 dark:text-gray-200">
            Your story
          </span>
        </Link>
      )}
      
      {/* Other users with stories */}
      {users.slice(1).map(storyUser => (
        <Link 
          key={storyUser.id} 
          to={`/stories/view/${storyUser.id}`}
          className="flex flex-col items-center"
        >
          <Avatar 
            src={storyUser.profile_image} 
            username={storyUser.username}
            size="lg"
            hasStory={true}
            viewedStory={!storyUser.hasUnseenStory}
          />
          <span className="text-xs mt-1 text-center truncate w-16 text-gray-800 dark:text-gray-200">
            {storyUser.username}
          </span>
        </Link>
      ))}
    </div>
  );
}