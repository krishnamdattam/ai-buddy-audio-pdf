
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  scrolled: boolean;
}

export const DashboardHeader = ({ searchQuery, onSearchChange, scrolled }: DashboardHeaderProps) => {
  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gray-900/80 backdrop-blur-lg shadow-lg' : ''}`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            AI-Buddy
          </h1>
          <div className="flex items-center gap-6">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700 text-white w-full"
              />
            </div>
            <span className="text-gray-300">Welcome Vijay</span>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer">
              <span className="text-white font-medium">V</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
