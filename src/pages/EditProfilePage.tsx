import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { supabase } from '../lib/supabase';

export function EditProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newProfileImage, setNewProfileImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    async function fetchProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile(data);
      setUsername(data.username);
      setFullName(data.full_name || '');
      setBio(data.bio || '');
      setProfileImage(data.profile_image);
    }
    
    fetchProfile();
  }, [user, navigate]);
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB');
        return;
      }
      
      setNewProfileImage(file);
      setProfileImage(URL.createObjectURL(file));
      setError(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Validate username
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      let updatedProfileImage = profile.profile_image;
      
      // Upload new profile image if selected
      if (newProfileImage) {
        const fileExt = newProfileImage.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `profiles/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, newProfileImage);
        
        if (uploadError) {
          setError(uploadError.message || 'Error uploading image');
          setIsLoading(false);
          return;
        }
        
        const { data } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
          
        updatedProfileImage = data.publicUrl;
      }
      
      // Check if username is taken (if changed)
      if (username !== profile.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .neq('id', user.id)
          .maybeSingle();
          
        if (existingUser) {
          setError('Username is already taken');
          setIsLoading(false);
          return;
        }
      }
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username,
          full_name: fullName.trim() || null,
          bio: bio.trim() || null,
          profile_image: updatedProfileImage,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (updateError) {
        setError(updateError.message || 'Error updating profile');
        setIsLoading(false);
        return;
      }
      
      // Success - redirect to profile
      navigate(`/profile/${user.id}`);
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsLoading(false);
    }
  };
  
  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-40 mb-8 dark:bg-gray-700"></div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex flex-col items-center mb-6">
            <div className="rounded-full bg-gray-200 h-24 w-24 mb-4 dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded w-32 dark:bg-gray-700"></div>
          </div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div className="h-10 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div className="h-24 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div className="h-10 bg-gray-200 rounded dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Edit Profile</h1>
      
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <Avatar 
              src={profileImage} 
              username={username}
              size="xl"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 text-white border-2 border-white dark:border-gray-800"
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageSelect}
            />
          </div>
          <p className="text-gray-600 text-sm dark:text-gray-400">
            Click the camera icon to change your profile picture
          </p>
        </div>
        
        <div className="space-y-4">
          <Input
            type="text"
            label="Username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            required
            minLength={3}
            maxLength={30}
            pattern="^[a-zA-Z0-9_\.]+$"
            title="Username can only contain letters, numbers, underscores and dots"
          />
          
          <Input
            type="text"
            label="Full Name"
            placeholder="Full Name (optional)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            fullWidth
            maxLength={50}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Bio
            </label>
            <textarea
              placeholder="Bio (optional)"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              maxLength={150}
              rows={4}
            />
          </div>
          
          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}