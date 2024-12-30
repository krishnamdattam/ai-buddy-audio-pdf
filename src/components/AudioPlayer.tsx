import React from 'react';
import { ChevronDown, ChevronUp, Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  title: string;
  subtitle: string;
  description: string;
  isExpanded: boolean;
  onToggle: () => void;
  isPlaying: boolean;
  onPlayPause: () => void;
}

const AudioPlayer = ({
  title,
  subtitle,
  description,
  isExpanded,
  onToggle,
  isPlaying,
  onPlayPause,
}: AudioPlayerProps) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg mb-4 border border-gray-700">
      <div
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause();
            }}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <div>
            <h3 className="font-medium text-gray-200">{title}</h3>
            <p className="text-sm text-gray-400">{subtitle}</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </div>
      
      {isExpanded && (
        <div className="p-4 border-t border-gray-700">
          <div className="bg-gray-700 rounded-full h-1 mb-4">
            <div className="bg-primary h-full rounded-full w-1/3"></div>
          </div>
          <p className="text-sm text-gray-400 mt-2">{description}</p>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;