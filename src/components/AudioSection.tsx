import React from 'react';
import { Note } from '@/types/notes';

interface AudioSectionProps {
  section: {
    title: string;
    subtitle: string;
    description: string;
    audioFile: string;
    pdfPage: number;
  };
  index: number;
  expandedPlayer: number | null;
  playingPlayer: number | null;
  notes: Note[];
  onExpand: (index: number | null) => void;
  onPlay: (index: number) => void;
  onPause: () => void;
  onOpenNoteDialog: (index: number) => void;
}

const AudioSection = ({
  section,
  index,
  expandedPlayer,
  playingPlayer,
  notes,
  onExpand,
  onPlay,
  onPause,
  onOpenNoteDialog,
}: AudioSectionProps) => {
  return (
    <div
      className={`bg-gray-800 rounded-lg p-3 transition-all duration-200 ${
        expandedPlayer === index ? 'ring-2 ring-purple-500' : ''
      } ${playingPlayer === index ? 'animate-glow relative' : ''}`}
    >
      {playingPlayer === index && (
        <>
          <div className="absolute inset-0 bg-purple-500/20 rounded-lg animate-pulse"></div>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg opacity-50 blur-sm group-hover:opacity-75 transition"></div>
        </>
      )}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{section.title}</h3>
            <p className="text-sm text-gray-400">{section.subtitle}</p>
          </div>
          <button
            onClick={() => onExpand(expandedPlayer === index ? null : index)}
            className="text-gray-400 hover:text-white"
          >
            {expandedPlayer === index ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>

        {expandedPlayer === index && (
          <div className="mt-3">
            <p className="text-sm text-gray-300 mb-3">{section.description}</p>
            <div className="flex items-center gap-4 mb-3">
              <audio
                className="flex-1"
                controls
                src={section.audioFile}
                onPlay={() => onPlay(index)}
                onPause={onPause}
              >
                <source src={section.audioFile} type="audio/mpeg" />
              </audio>
              <button
                onClick={() => onOpenNoteDialog(index)}
                className="flex items-center gap-2 px-3 py-1 bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span className="text-sm text-white">Notes</span>
              </button>
            </div>
            {notes.find((note) => note.sectionId === index) && (
              <div className="mt-2 p-3 bg-gray-700/50 rounded-md">
                <p className="text-sm text-gray-300">
                  {notes.find((note) => note.sectionId === index)?.content}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioSection;