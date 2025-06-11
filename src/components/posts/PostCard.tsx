import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../ui/Avatar';
import { CommentList } from './CommentList';

type PostCardProps = {
  post: {
    id: string;
    user_id: string;
    image_url: string;
    caption: string | null;
    created_at: string;
  };
};

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch profile data for the post author
  useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', post.user_id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data);
      }
    }
    
    fetchProfile();
  }, [post.user_id]);

  // Check if current user has liked this post
  useEffect(() => {
    if (!user) return;
    
    async function checkLikeStatus() {
      const { data, error } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();
      
      if (!error && data) {
        setIsLiked(true);
      }
    }
    
    checkLikeStatus();
  }, [post.id, user]);

  // Check if current user has saved this post
  useEffect(() => {
    if (!user) return;
    
    async function checkSavedStatus() {
      const { data, error } = await supabase
        .from('saved_posts')
        .select('*')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();
      
      if (!error && data) {
        setIsSaved(true);
      }
    }
    
    checkSavedStatus();
  }, [post.id, user]);

  // Get like count
  useEffect(() => {
    async function getLikeCount() {
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('post_id', post.id);
      
      if (!error && count !== null) {
        setLikeCount(count);
      }
    }
    
    getLikeCount();
    
    // Set up real-time subscription for likes
    const channel = supabase
      .channel(`likes:${post.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'likes',
        filter: `post_id=eq.${post.id}`
      }, () => {
        getLikeCount();
        
        // If user has just liked or unliked, check their status
        if (user) {
          checkLikeStatus();
        }
      })
      .subscribe();
      
    async function checkLikeStatus() {
      const { data, error } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();
      
      setIsLiked(!error && !!data);
    }
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id, user]);

  // Get comment count
  useEffect(() => {
    async function getCommentCount() {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact' })
        .eq('post_id', post.id);
      
      if (!error && count !== null) {
        setCommentCount(count);
      }
    }
    
    getCommentCount();
    
    // Set up real-time subscription for comments
    const channel = supabase
      .channel(`comments:${post.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'comments',
        filter: `post_id=eq.${post.id}`
      }, getCommentCount)
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id]);

  // Toggle like
  const handleLike = async () => {
    if (!user) return;
    
    if (isLiked) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);
      
      if (!error) {
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      }
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert({
          post_id: post.id,
          user_id: user.id
        });
      
      if (!error) {
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        
        // Create notification for post owner
        if (post.user_id !== user.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: post.user_id,
              from_user_id: user.id,
              type: 'like',
              post_id: post.id
            });
        }
      }
    }
  };

  // Toggle save
  const handleSave = async () => {
    if (!user) return;
    
    if (isSaved) {
      // Unsave
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);
      
      if (!error) {
        setIsSaved(false);
      }
    } else {
      // Save
      const { error } = await supabase
        .from('saved_posts')
        .insert({
          post_id: post.id,
          user_id: user.id
        });
      
      if (!error) {
        setIsSaved(true);
      }
    }
  };

  // Add comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !commentText.trim()) return;
    
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: post.id,
        user_id: user.id,
        content: commentText.trim()
      });
    
    setIsSubmitting(false);
    
    if (!error) {
      setCommentText('');
      setCommentCount(prev => prev + 1);
      
      // Create notification for post owner
      if (post.user_id !== user.id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: post.user_id,
            from_user_id: user.id,
            type: 'comment',
            post_id: post.id
          });
      }
    }
  };

  if (!profile) {
    return <div className="animate-pulse bg-gray-200 rounded-lg h-96 dark:bg-gray-700"></div>;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <Link to={`/profile/${post.user_id}`} className="flex items-center">
          <Avatar
            src={profile.profile_image}
            username={profile.username}
            size="md"
          />
          <div className="ml-3">
            <span className="font-semibold text-sm">{profile.username}</span>
          </div>
        </Link>
        <button className="text-gray-500 dark:text-gray-400">
          <MoreHorizontal size={20} />
        </button>
      </div>
      
      {/* Post Image */}
      <div className="aspect-square bg-gray-100 dark:bg-gray-900">
        <img 
          src={post.image_url} 
          alt={post.caption || 'Post image'} 
          className="w-full h-full object-cover"
          onDoubleClick={handleLike}
        />
      </div>
      
      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleLike}
              className={`${isLiked ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}
            >
              <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
              className="text-gray-800 dark:text-gray-200"
            >
              <MessageCircle size={24} />
            </button>
            <button className="text-gray-800 dark:text-gray-200">
              <Send size={24} />
            </button>
          </div>
          <button 
            onClick={handleSave}
            className={`${isSaved ? 'text-black dark:text-white' : 'text-gray-800 dark:text-gray-200'}`}
          >
            <Bookmark size={24} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>
        
        {/* Likes */}
        {likeCount > 0 && (
          <div className="font-semibold text-sm mb-1">
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </div>
        )}
        
        {/* Caption */}
        {post.caption && (
          <div className="mb-1">
            <span className="font-semibold text-sm mr-2">{profile.username}</span>
            <span className="text-sm">{post.caption}</span>
          </div>
        )}
        
        {/* Show comments link */}
        {commentCount > 0 && !showComments && (
          <button 
            onClick={() => setShowComments(true)}
            className="text-gray-500 text-sm mb-1 dark:text-gray-400"
          >
            View all {commentCount} comments
          </button>
        )}
        
        {/* Comments */}
        {showComments && (
          <CommentList postId={post.id} />
        )}
        
        {/* Timestamp */}
        <div className="text-gray-500 text-xs mt-1 dark:text-gray-400">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </div>
      </div>
      
      {/* Add comment */}
      <form onSubmit={handleAddComment} className="flex items-center border-t border-gray-200 px-4 py-2 dark:border-gray-700">
        <input
          type="text"
          placeholder="Add a comment..."
          className="flex-1 bg-transparent text-sm outline-none text-gray-800 dark:text-gray-200"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          disabled={isSubmitting}
        />
        {commentText.trim() && (
          <button 
            type="submit"
            className="ml-2 text-blue-500 font-semibold text-sm disabled:opacity-50"
            disabled={isSubmitting}
          >
            Post
          </button>
        )}
      </form>
    </div>
  );
}