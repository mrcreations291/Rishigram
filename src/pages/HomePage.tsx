import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/posts/PostCard';
import { StoryBar } from '../components/stories/StoryBar';

export function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    
    async function fetchPosts() {
      setLoading(true);
      
      // Fetch posts from users the current user follows + their own posts
      const { data: followingIds } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
        
      const followingUserIds = followingIds?.map(f => f.following_id) || [];
      
      // Include current user's posts
      const userIds = [...followingUserIds, user.id];
      
      // If the user doesn't follow anyone yet, show some recent posts
      const { data, error } = userIds.length > 1
        ? await supabase
            .from('posts')
            .select('*')
            .in('user_id', userIds)
            .order('created_at', { ascending: false })
            .limit(10)
        : await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
      
      setLoading(false);
      
      if (error) {
        console.error('Error fetching posts:', error);
      } else {
        setPosts(data || []);
      }
    }
    
    fetchPosts();
    
    // Set up a real-time subscription for new posts
    const channel = supabase
      .channel('posts_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'posts' }, 
        fetchPosts
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  if (loading) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="animate-pulse bg-white rounded-lg h-24 mb-4 dark:bg-gray-800"></div>
        <div className="animate-pulse bg-white rounded-lg h-96 mb-6 dark:bg-gray-800"></div>
        <div className="animate-pulse bg-white rounded-lg h-96 dark:bg-gray-800"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-lg mx-auto">
      {/* Stories */}
      <div className="bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <StoryBar />
      </div>
      
      {/* Posts Feed */}
      {posts.length > 0 ? (
        posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-2">Welcome to RishiGram!</h2>
          <p className="text-gray-600 mb-4 dark:text-gray-400">
            Follow some users to see their posts in your feed, or create your first post.
          </p>
        </div>
      )}
    </div>
  );
}