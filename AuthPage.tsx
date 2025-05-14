import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';

export function AuthPage() {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Login
        const { error } = await signIn(email, password) || {};
        
        if (error) {
          setError(error.message || 'Failed to sign in');
          setIsLoading(false);
          return;
        }
        
        navigate('/');
      } else {
        // Check if username is available
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .maybeSingle();
          
        if (existingUser) {
          setError('Username is already taken');
          setIsLoading(false);
          return;
        }
        
        // Sign up
        const { error } = await signUp(email, password) || {};
        
        if (error) {
          setError(error.message || 'Failed to sign up');
          setIsLoading(false);
          return;
        }
        
        // Create profile
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        if (user) {
          await supabase.from('profiles').insert({
            id: user.id,
            username,
            email
          });
        }
        
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#405DE6] to-[#5851DB] bg-clip-text text-transparent">
            RishiGram
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 flex items-start dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
              <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <Input
                type="text"
                label="Username"
                icon={<User size={18} className="text-gray-500 dark:text-gray-400" />}
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                required
                minLength={3}
                maxLength={30}
                pattern="^[a-zA-Z0-9_\.]+$"
                title="Username can only contain letters, numbers, underscores and dots"
              />
            )}
            
            <Input
              type="email"
              label="Email address"
              icon={<Mail size={18} className="text-gray-500 dark:text-gray-400" />}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
            />
            
            <Input
              type="password"
              label="Password"
              icon={<Lock size={18} className="text-gray-500 dark:text-gray-400" />}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              minLength={6}
            />
            
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}