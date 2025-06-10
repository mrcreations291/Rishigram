import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';

type Comment = {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    profile_image: string | null;
  }
};

type CommentListProps = {
  postId: string;
};

export function CommentList({ postId }: CommentListProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchComments() {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            username,
            profile_image
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });
      
      setLoading(false);
      
      if (error) {
        console.error('Error fetching comments:', error);
      } else if (data) {
        setComments(data as unknown as Comment[]);
      }
    }
    
    fetchComments();
    
    // Set up real-time subscription for comments
    const channel = supabase
      .channel(`comments:${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`
      }, fetchComments)
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);
  
  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);
      
    if (error) {
      console.error('Error deleting comment:', error);
    } else {
      setComments(comments.filter(comment => comment.id !== commentId));
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-2 py-2">
        <div className="animate-pulse flex items-start gap-2">
          <div className="rounded-full bg-gray-200 h-8 w-8 dark:bg-gray-700"></div>
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-1/4 mb-2 dark:bg-gray-700"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 dark:bg-gray-700"></div>
          </div>
        </div>
        <div className="animate-pulse flex items-start gap-2">
          <div className="rounded-full bg-gray-200 h-8 w-8 dark:bg-gray-700"></div>
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-1/3 mb-2 dark:bg-gray-700"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (comments.length === 0) {
    return (
      <div className="py-2 text-gray-500 text-sm text-center dark:text-gray-400">
        No comments yet. Be the first to comment!
      </div>
    );
  }
  
  return (
    <div className="space-y-3 max-h-40 overflow-y-auto py-2">
      {comments.map(comment => (
        <div key={comment.id} className="flex items-start gap-2">
          <Link to={`/profile/${comment.user_id}`}>
            <Avatar
              src={comment.profiles.profile_image}
              username={comment.profiles.username}
              size="sm"
            />
          </Link>
          <div className="flex-1">
            <div className="inline-flex items-start">
              <Link to={`/profile/${comment.user_id}`} className="font-semibold text-sm mr-1">
                {comment.profiles.username}
              </Link>
              <span className="text-sm">{comment.content}</span>
            </div>
            <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
            </div>
          </div>
          {user && user.id === comment.user_id && (
            <button 
              onClick={() => handleDeleteComment(comment.id)}
              className="text-gray-500 p-1 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}