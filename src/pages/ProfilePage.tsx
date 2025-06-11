import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Grid, Settings, User, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { supabase } from '../lib/supabase';

type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  profile_image: string | null;
  created_at: string;
};

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [postCount, setPostCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  
  const isCurrentUser = user && id === user.id;
  
  // Fetch profile data
  useEffect(() => {
    if (!id) return;
    
    async function fetchProfile() {
      setLoading(true);
      
      // Get profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }
      
      setProfile(data);
      
      // Get post count
      const { count: postCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('user_id', id);
        
      setPostCount(postCount || 0);
      
      // Get follower count
      const { count: followerCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact' })
        .eq('following_id', id);
        
      setFollowerCount(followerCount || 0);
      
      // Get following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact' })
        .eq('follower_id', id);
        
      setFollowingCount(followingCount || 0);
      
      // Check if current user is following this profile
      if (user && id !== user.id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', id)
          .maybeSingle();
          
        setIsFollowing(!!followData);
      }
      
      // Get posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });
        
      setPosts(postsData || []);
      
      setLoading(false);
    }
    
    fetchProfile();
    
    // Set up real-time subscriptions
    const postsChannel = supabase
      .channel('posts_profile_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts', filter: `user_id=eq.${id}` }, 
        () => {
          // Update posts and post count
          fetchProfile();
        }
      )
      .subscribe();
      
    const followsChannel = supabase
      .channel('follows_profile_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'follows', filter: `following_id=eq.${id}` }, 
        () => {
          // Update follower count and follow status
          fetchProfile();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(followsChannel);
    };
  }, [id, user]);
  
  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!user || !id || isCurrentUser) return;
    
    setFollowLoading(true);
    
    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', id);
          
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: id
          });
          
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        
        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: id,
            from_user_id: user.id,
            type: 'follow'
          });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
    
    setFollowLoading(false);
  };
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
          <div className="rounded-full bg-gray-200 h-24 w-24 md:h-36 md:w-36 dark:bg-gray-700"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4 dark:bg-gray-700"></div>
            <div className="flex space-x-6 mb-4">
              <div className="h-4 bg-gray-200 rounded w-16 dark:bg-gray-700"></div>
              <div className="h-4 bg-gray-200 rounded w-16 dark:bg-gray-700"></div>
              <div className="h-4 bg-gray-200 rounded w-16 dark:bg-gray-700"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-48 mb-2 dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded w-32 dark:bg-gray-700"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700"></div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="text-center py-12">
        <User size={64} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">User not found</h2>
        <p className="text-gray-600 mb-4 dark:text-gray-400">
          The user you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/">
          <Button>Go to Home</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
        <Avatar 
          src={profile.profile_image} 
          username={profile.username}
          size="xl"
          hasStory={false}
        />
        
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center mb-4 gap-4">
            <h1 className="text-xl font-semibold">{profile.username}</h1>
            
            {isCurrentUser ? (
              <div className="flex gap-2">
                <Link to="/edit-profile">
                  <Button variant="outline" size="sm">
                    Edit Profile
                  </Button>
                </Link>
                <Link to="/settings">
                  <button className="text-gray-500 dark:text-gray-400">
                    <Settings size={20} />
                  </button>
                </Link>
              </div>
            ) : (
              <Button 
                variant={isFollowing ? 'outline' : 'primary'} 
                size="sm"
                onClick={handleFollowToggle}
                isLoading={followLoading}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>
          
          <div className="flex justify-center md:justify-start space-x-6 mb-4">
            <div>
              <span className="font-semibold">{postCount}</span> {postCount === 1 ? 'post' : 'posts'}
            </div>
            <div>
              <span className="font-semibold">{followerCount}</span> {followerCount === 1 ? 'follower' : 'followers'}
            </div>
            <div>
              <span className="font-semibold">{followingCount}</span> following
            </div>
          </div>
          
          {profile.full_name && (
            <div className="font-semibold mb-1">{profile.full_name}</div>
          )}
          
          {profile.bio && (
            <div className="whitespace-pre-line">{profile.bio}</div>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setActiveTab('posts')}
            className={`text-center py-2 px-4 ${
              activeTab === 'posts'
                ? 'border-t-2 border-black dark:border-white'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Grid size={16} className="inline-block mr-1" />
            <span className="uppercase text-xs font-semibold">Posts</span>
          </button>
          
          {isCurrentUser && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`text-center py-2 px-4 ml-8 ${
                activeTab === 'saved'
                  ? 'border-t-2 border-black dark:border-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Bookmark size={16} className="inline-block mr-1" />
              <span className="uppercase text-xs font-semibold">Saved</span>
            </button>
          )}
        </div>
        
        {/* Posts Grid */}
        {activeTab === 'posts' && (
          <>
            {posts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {posts.map(post => (
                  <Link 
                    key={post.id} 
                    to={`/post/${post.id}`}
                    className="aspect-square bg-gray-100 relative overflow-hidden dark:bg-gray-800"
                  >
                    <img 
                      src={post.image_url} 
                      alt={post.caption || 'Post'} 
                      className="w-full h-full object-cover"
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Grid size={64} className="mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Posts Yet</h2>
                {isCurrentUser ? (
                  <div>
                    <p className="text-gray-600 mb-4 dark:text-gray-400">
                      Share photos and videos that will appear on your profile.
                    </p>
                    <Link to="/create">
                      <Button>Create First Post</Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    This user hasn't posted anything yet.
                  </p>
                )}
              </div>
            )}
          </>
        )}
        
        {/* Saved Posts */}
        {activeTab === 'saved' && isCurrentUser && (
          <div className="text-center py-12">
            <Bookmark size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No saved posts yet</h2>
            <p className="text-gray-600 dark:text-gray-400">
              When you save posts, they'll appear here.
            </p>
            <Link to="/saved" className="mt-4 inline-block">
              <Button variant="outline">View All Saved Posts</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}