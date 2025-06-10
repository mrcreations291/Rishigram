import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';

export function CreatePostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cleanup preview URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      // Revoke previous preview URL if it exists
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    }
  };
  
  const clearSelectedImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setSelectedImage(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!selectedImage) {
      setError('Please select an image to post');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      // 1. Upload image to Storage
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `posts/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, selectedImage);
      
      if (uploadError) {
        setError(uploadError.message || 'Error uploading image');
        setIsUploading(false);
        return;
      }
      
      // 2. Get public URL
      const { data } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
        
      const publicUrl = data.publicUrl;
      
      // 3. Create post in database
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          caption: caption.trim() || null
        });
        
      if (postError) {
        setError(postError.message || 'Error creating post');
        setIsUploading(false);
        return;
      }
      
      // Success - redirect to home
      navigate('/');
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsUploading(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
      
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        {!preview ? (
          <div 
            className="flex flex-col items-center justify-center h-80 cursor-pointer border-b border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-700"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={64} className="text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2 dark:text-gray-400">Click to select an image</p>
            <p className="text-gray-500 text-sm dark:text-gray-500">JPG, PNG, GIF (Max 5MB)</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageSelect}
            />
          </div>
        ) : (
          <div className="relative">
            <div className="aspect-square">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={clearSelectedImage}
              className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
            >
              <X size={20} />
            </button>
          </div>
        )}
        
        <div className="p-4">
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          
          <div className="mt-4">
            <Button
              type="submit"
              fullWidth
              isLoading={isUploading}
              disabled={!selectedImage || isUploading}
            >
              Post
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}