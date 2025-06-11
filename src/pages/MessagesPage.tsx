import { useState, useEffect, useRef } from 'react';
import { Send, Search, Phone, Video, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

type Conversation = {
  user_id: string;
  username: string;
  profile_image: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
};

export function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock conversations for demonstration
  const mockConversations: Conversation[] = [
    {
      user_id: 'user1',
      username: 'sarah_wilson',
      profile_image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
      last_message: 'Hey! How are you doing?',
      last_message_time: new Date(Date.now() - 300000).toISOString(),
      unread_count: 2
    },
    {
      user_id: 'user2',
      username: 'mike_photo',
      profile_image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
      last_message: 'Thanks for the follow!',
      last_message_time: new Date(Date.now() - 3600000).toISOString(),
      unread_count: 0
    },
    {
      user_id: 'user3',
      username: 'travel_addict',
      profile_image: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150',
      last_message: 'Amazing photos from your trip!',
      last_message_time: new Date(Date.now() - 7200000).toISOString(),
      unread_count: 1
    }
  ];

  // Mock messages for demonstration
  const mockMessages: { [key: string]: Message[] } = {
    user1: [
      {
        id: '1',
        sender_id: 'user1',
        receiver_id: user?.id || '',
        content: 'Hey! How are you doing?',
        created_at: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: '2',
        sender_id: user?.id || '',
        receiver_id: 'user1',
        content: 'I\'m doing great! Thanks for asking 😊',
        created_at: new Date(Date.now() - 240000).toISOString()
      },
      {
        id: '3',
        sender_id: 'user1',
        receiver_id: user?.id || '',
        content: 'That\'s awesome! Want to grab coffee sometime?',
        created_at: new Date(Date.now() - 180000).toISOString()
      }
    ],
    user2: [
      {
        id: '4',
        sender_id: 'user2',
        receiver_id: user?.id || '',
        content: 'Thanks for the follow!',
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '5',
        sender_id: user?.id || '',
        receiver_id: 'user2',
        content: 'No problem! Love your photography work',
        created_at: new Date(Date.now() - 3540000).toISOString()
      }
    ],
    user3: [
      {
        id: '6',
        sender_id: 'user3',
        receiver_id: user?.id || '',
        content: 'Amazing photos from your trip!',
        created_at: new Date(Date.now() - 7200000).toISOString()
      }
    ]
  };

  useEffect(() => {
    // In a real app, fetch conversations from database
    setConversations(mockConversations);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      // In a real app, fetch messages from database
      setMessages(mockMessages[selectedConversation] || []);
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const message: Message = {
      id: Date.now().toString(),
      sender_id: user.id,
      receiver_id: selectedConversation,
      content: newMessage.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // In a real app, save message to database
    // await supabase.from('messages').insert(message);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUser = conversations.find(conv => conv.user_id === selectedConversation);

  if (loading) {
    return (
      <div className="flex h-full">
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
          <div className="animate-pulse p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="rounded-full bg-gray-200 h-12 w-12 dark:bg-gray-700"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 dark:bg-gray-700"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 dark:bg-gray-700"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg border border-gray-200 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      {/* Conversations List */}
      <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={18} className="text-gray-500 dark:text-gray-400" />}
            fullWidth
          />
        </div>
        
        <div className="overflow-y-auto">
          {filteredConversations.map(conversation => (
            <button
              key={conversation.user_id}
              onClick={() => setSelectedConversation(conversation.user_id)}
              className={`w-full p-4 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 ${
                selectedConversation === conversation.user_id ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              <Avatar
                src={conversation.profile_image}
                username={conversation.username}
                size="md"
              />
              <div className="ml-3 flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{conversation.username}</span>
                  {conversation.unread_count > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {conversation.last_message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="hidden md:flex flex-1 flex-col">
        {selectedConversation && selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <Link to={`/profile/${selectedUser.user_id}`} className="flex items-center">
                <Avatar
                  src={selectedUser.profile_image}
                  username={selectedUser.username}
                  size="md"
                />
                <span className="ml-3 font-semibold">{selectedUser.username}</span>
              </Link>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <Phone size={20} />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <Video size={20} />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <Info size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === user?.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}