import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/Avatar';

type Story = {
  id: string;
  user_id: string;
  media_url: string;
  created_at: string;
};

type Profile = {
  id: string;
  username: string;
  profile_image: string | null;
};

export function ViewStoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stories, setStories] = useState<Story[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!id || !user) return;
    
    async function fetchStories() {
      setLoading(true);
      
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, profile_image')
        .eq('id', id)
        .single();
        
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        navigate('/');
        return;
      }
      
      setProfile(profileData);
      
      // Get stories from the last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', id)
        .gt('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: true });
        
      if (storiesError) {
        console.error('Error fetching stories:', storiesError);
        navigate('/');
        return;
      }
      
      if (!storiesData || storiesData.length === 0) {
        // No stories available
        navigate('/');
        return;
      }
      
      setStories(storiesData);
      
      // Mark stories as viewed
      for (const story of storiesData) {
        // Only mark if viewer is not the creator
        if (user.id !== id) {
          await supabase
            .from('story_views')
            .upsert({
              user_id: user.id,
              story_id: story.id
            }, {
              onConflict: 'user_id,story_id'
            });
        }
      }
      
      setLoading(false);
    }
    
    fetchStories();
  }, [id, user, navigate]);
  
  // Auto-advance stories
  useEffect(() => {
    if (loading || stories.length === 0) return;
    
    const timer = setTimeout(() => {
      if (currentStoryIndex < stories.length - 1) {
        setCurrentStoryIndex(prevIndex => prevIndex + 1);
      } else {
        // End of stories, close the viewer
        navigate('/');
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [currentStoryIndex, stories.length, loading, navigate]);
  
  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prevIndex => prevIndex - 1);
    }
  };
  
  const handleNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prevIndex => prevIndex + 1);
    } else {
      // End of stories, close the viewer
      navigate('/');
    }
  };
  
  if (loading || !profile || stories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-pulse w-12 h-12 rounded-full bg-gray-700"></div>
      </div>
    );
  }
  
  const currentStory = stories[currentStoryIndex];
  
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      {/* Close button */}
      <button 
        className="absolute top-4 right-4 text-white p-2"
        onClick={() => navigate('/')}
      >
        <X size={24} />
      </button>
      
      {/* Story container */}
      <div className="relative w-full h-full max-w-md max-h-[90vh] mx-auto">
        {/* Story image */}
        <img 
          src={currentStory.media_url} 
          alt="Story" 
          className="w-full h-full object-contain"
        />
        
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 flex p-2 gap-1">
          {stories.map((_, index) => (
            <div 
              key={index} 
              className={`h-1 flex-1 rounded-full ${
                index < currentStoryIndex ? 'bg-white' : 
                index === currentStoryIndex ? 'bg-white animate-progress' : 'bg-white/30'
              }`}
              style={{
                animationDuration: index === currentStoryIndex ? '5s' : '0s',
              }}
            ></div>
          ))}
        </div>
        
        {/* User info */}
        <div className="absolute top-6 left-4 flex items-center">
          <Avatar 
            src={profile.profile_image} 
            username={profile.username}
            size="sm"
          />
          <div className="ml-2 text-white">
            <div className="font-semibold text-sm">{profile.username}</div>
            <div className="text-xs opacity-80">
              {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        {currentStoryIndex > 0 && (
          <button 
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white p-2"
            onClick={handlePrevStory}
          >
            <ChevronLeft size={36} />
          </button>
        )}
        
        <button 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white p-2"
          onClick={handleNextStory}
        >
          <ChevronRight size={36} />
        </button>
      </div>
    </div>
  );
}