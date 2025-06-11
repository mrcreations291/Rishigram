import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Play, Pause } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';

// Mock video data for demonstration
const mockReels = [
  {
    id: '1',
    user_id: 'user1',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    caption: 'Amazing sunset timelapse! 🌅',
    created_at: new Date().toISOString(),
    profile: {
      username: 'nature_lover',
      profile_image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150'
    }
  },
  {
    id: '2',
    user_id: 'user2',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    caption: 'Creative animation work 🎨',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    profile: {
      username: 'artist_pro',
      profile_image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150'
    }
  },
  {
    id: '3',
    user_id: 'user3',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    caption: 'Epic adventure footage! 🏔️',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    profile: {
      username: 'adventure_seeker',
      profile_image: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150'
    }
  }
];

export function ReelsPage() {
  const { user } = useAuth();
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likes, setLikes] = useState<{[key: string]: boolean}>({});
  const [saved, setSaved] = useState<{[key: string]: boolean}>({});
  const videoRefs = useRef<{[key: string]: HTMLVideoElement}>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const currentReel = mockReels[currentReelIndex];

  // Handle video play/pause
  useEffect(() => {
    const currentVideo = videoRefs.current[currentReel.id];
    if (currentVideo) {
      if (isPlaying) {
        currentVideo.play();
      } else {
        currentVideo.pause();
      }
    }
  }, [currentReel.id, isPlaying]);

  // Handle scroll to change reels
  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0 && currentReelIndex < mockReels.length - 1) {
        setCurrentReelIndex(prev => prev + 1);
      } else if (e.deltaY < 0 && currentReelIndex > 0) {
        setCurrentReelIndex(prev => prev - 1);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleScroll, { passive: false });
      return () => container.removeEventListener('wheel', handleScroll);
    }
  }, [currentReelIndex]);

  // Handle touch gestures for mobile
  useEffect(() => {
    let startY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0].clientY;
      const diff = startY - endY;

      if (Math.abs(diff) > 50) { // Minimum swipe distance
        if (diff > 0 && currentReelIndex < mockReels.length - 1) {
          setCurrentReelIndex(prev => prev + 1);
        } else if (diff < 0 && currentReelIndex > 0) {
          setCurrentReelIndex(prev => prev - 1);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchend', handleTouchEnd);
      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [currentReelIndex]);

  const handleLike = async (reelId: string) => {
    setLikes(prev => ({ ...prev, [reelId]: !prev[reelId] }));
    // In a real app, you would save this to the database
  };

  const handleSave = async (reelId: string) => {
    setSaved(prev => ({ ...prev, [reelId]: !prev[reelId] }));
    // In a real app, you would save this to the database
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden md:ml-64"
      style={{ height: '100vh' }}
    >
      <div className="relative w-full h-full">
        {/* Current Reel */}
        <div className="absolute inset-0 flex items-center justify-center">
          <video
            ref={(el) => {
              if (el) videoRefs.current[currentReel.id] = el;
            }}
            src={currentReel.video_url}
            className="w-full h-full object-cover max-w-md mx-auto"
            loop
            muted
            playsInline
            onClick={togglePlayPause}
          />
          
          {/* Play/Pause overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={togglePlayPause}
                className="bg-black bg-opacity-50 rounded-full p-4"
              >
                <Play size={48} className="text-white ml-1" />
              </button>
            </div>
          )}
        </div>

        {/* User info and actions overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-end justify-between max-w-md mx-auto">
            {/* Left side - User info and caption */}
            <div className="flex-1 mr-4">
              <Link to={`/profile/${currentReel.user_id}`} className="flex items-center mb-2">
                <Avatar
                  src={currentReel.profile.profile_image}
                  username={currentReel.profile.username}
                  size="sm"
                />
                <span className="text-white font-semibold ml-2">
                  {currentReel.profile.username}
                </span>
              </Link>
              
              <p className="text-white text-sm mb-1">{currentReel.caption}</p>
              <p className="text-white/70 text-xs">
                {formatDistanceToNow(new Date(currentReel.created_at), { addSuffix: true })}
              </p>
            </div>

            {/* Right side - Action buttons */}
            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={() => handleLike(currentReel.id)}
                className={`p-2 ${likes[currentReel.id] ? 'text-red-500' : 'text-white'}`}
              >
                <Heart size={28} fill={likes[currentReel.id] ? 'currentColor' : 'none'} />
              </button>
              
              <button className="text-white p-2">
                <MessageCircle size={28} />
              </button>
              
              <button className="text-white p-2">
                <Send size={28} />
              </button>
              
              <button
                onClick={() => handleSave(currentReel.id)}
                className={`p-2 ${saved[currentReel.id] ? 'text-white' : 'text-white'}`}
              >
                <Bookmark size={28} fill={saved[currentReel.id] ? 'currentColor' : 'none'} />
              </button>
              
              <button className="text-white p-2">
                <MoreHorizontal size={28} />
              </button>
            </div>
          </div>
        </div>

        {/* Progress indicators */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2">
          {mockReels.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-8 rounded-full ${
                index === currentReelIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Navigation hints */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-sm opacity-70">
          Swipe up/down or scroll to navigate
        </div>
      </div>
    </div>
  );
}