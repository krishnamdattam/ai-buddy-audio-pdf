import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Settings, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface HeaderProps {
  showSearch?: boolean;
  showProfile?: boolean;
}

const Header = ({ showSearch = true, showProfile = true }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <div 
          onClick={() => navigate('/dashboard')} 
          className="cursor-pointer"
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            AI-Buddy
          </h1>
        </div>

        {/* Navigation */}
        <nav className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-1">
          <Button
            variant="ghost"
            onClick={() => navigate('/course-generator')}
            className={cn(
              "px-6 py-2 text-sm font-medium transition-colors",
              isActive('/course-generator')
                ? "text-purple-400 bg-purple-500/10"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            )}
          >
            CREATE
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/course-editor')}
            className={cn(
              "px-6 py-2 text-sm font-medium transition-colors",
              isActive('/course-editor')
                ? "text-purple-400 bg-purple-500/10"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            )}
          >
            MANAGE
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/course-publisher')}
            className={cn(
              "px-6 py-2 text-sm font-medium transition-colors",
              isActive('/course-publisher')
                ? "text-purple-400 bg-purple-500/10"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            )}
          >
            PUBLISH
          </Button>
        </nav>

        {/* Search and Profile Section */}
        <div className="flex items-center space-x-6">
          {showSearch && (
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search courses..."
                className="pl-10 bg-gray-800/50 border-gray-700 text-white w-full"
              />
            </div>
          )}
          
          {showProfile && (
            <>
              <span className="text-gray-300">Welcome Vijay</span>
              
              {/* Profile Dropdown */}
              <div className="relative group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer">
                  <span className="text-white font-medium">V</span>
                </div>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 py-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button 
                    className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center"
                    onClick={() => console.log('Settings clicked')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                  <button 
                    className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 