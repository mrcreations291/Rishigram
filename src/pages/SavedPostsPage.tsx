import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Grid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type SavedPost = {
  id: string;
  post_id: string;
  created_at: string;
  post: {
    id: string;
    image_url: string;
    caption: string | null;
    user_id: string;
    profiles: {
      username: string;
    };
  };
};

export function SavedPostsPage() {
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchSavedPosts() {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('saved_posts')
        .select(`
          *,
          post:post_id (
            id,
            image_url,
            caption,
            user_id,
            profiles:user_id (
              username
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setLoading(false);

      if (error) {
        console.error('Error fetching saved posts:', error);
      } else if (data) {
        setSavedPosts(data as unknown as SavedPost[]);
      }
    }

    fetchSavedPosts();

    // Set up real-time subscription for saved posts
    const channel = supabase
      .channel(`saved_posts:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'saved_posts',
        filter: `user_id=eq.${user.id}`
      }, fetchSavedPosts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Saved Posts</h1>
        <div className="grid grid-cols-3 gap-1">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 animate-pulse dark:bg-gray-700"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Saved Posts</h1>

      {savedPosts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <Bookmark size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No saved posts yet</h2>
          <p className="text-gray-600 dark:text-gray-400">
            When you save posts, they'll appear here so you can easily find them later.
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-center mb-6">
            <div className="text-center border-t-2 border-black py-2 px-4 dark:border-white">
              <Grid size={16} className="inline-block mr-1" />
              <span className="uppercase text-xs font-semibold">Saved</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {savedPosts.map(savedPost => (
              <Link
                key={savedPost.id}
                to={`/post/${savedPost.post.id}`}
                className="aspect-square bg-gray-100 relative overflow-hidden group dark:bg-gray-800"
              >
                <img
                  src={savedPost.post.image_url}
                  alt={savedPost.post.caption || 'Saved post'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 flex items-center justify-center">
                  <Bookmark
                    size={24}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    fill="currentColor"
                  />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}