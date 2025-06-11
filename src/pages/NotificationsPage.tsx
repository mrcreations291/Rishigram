import { useState, useEffect } from 'react';
import { Heart, MessageCircle, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';

type Notification = {
  id: string;
  user_id: string;
  from_user_id: string;
  type: 'like' | 'comment' | 'follow';
  post_id?: string;
  created_at: string;
  read: boolean;
  from_user: {
    username: string;
    profile_image: string | null;
  };
  post?: {
    image_url: string;
  };
};

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchNotifications() {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          from_user:from_user_id (
            username,
            profile_image
          ),
          post:post_id (
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setLoading(false);

      if (error) {
        console.error('Error fetching notifications:', error);
      } else if (data) {
        setNotifications(data as unknown as Notification[]);
      }
    }

    fetchNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, fetchNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={20} className="text-red-500" fill="currentColor" />;
      case 'comment':
        return <MessageCircle size={20} className="text-blue-500" />;
      case 'follow':
        return <UserPlus size={20} className="text-green-500" />;
      default:
        return <Heart size={20} className="text-gray-500" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      default:
        return 'interacted with your content';
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="rounded-full bg-gray-200 h-12 w-12 dark:bg-gray-700"></div>
              <div className="ml-3 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 dark:bg-gray-700"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 dark:bg-gray-700"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded dark:bg-gray-700"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <Heart size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No notifications yet</h2>
          <p className="text-gray-600 dark:text-gray-400">
            When someone likes, comments, or follows you, you'll see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 ${
                !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <Link to={`/profile/${notification.from_user_id}`} className="flex-shrink-0">
                <Avatar
                  src={notification.from_user.profile_image}
                  username={notification.from_user.username}
                  size="md"
                />
              </Link>

              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  <span className="font-semibold mr-1">
                    {notification.from_user.username}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 mr-2">
                    {getNotificationText(notification)}
                  </span>
                  {getNotificationIcon(notification.type)}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>

              {notification.post && (
                <Link
                  to={`/post/${notification.post_id}`}
                  className="flex-shrink-0 ml-3"
                >
                  <img
                    src={notification.post.image_url}
                    alt="Post"
                    className="w-12 h-12 object-cover rounded"
                  />
                </Link>
              )}

              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}