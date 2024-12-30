import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import AudioPlayer from '../components/AudioPlayer';
import documentPdf from '../assets/pdf/document.pdf';
import audio1 from '../assets/audio/new1.mp3';
import audio2 from '../assets/audio/new2.mp3';
import audio3 from '../assets/audio/new3.mp3';
import audio4 from '../assets/audio/new4.mp3';
import audio5 from '../assets/audio/new5.mp3';
import audio6 from '../assets/audio/new6.mp3';

const Index = () => {
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
  const [playingPlayer, setPlayingPlayer] = useState<number | null>(null);

  const audioSections = [
    { 
      title: 'Introduction', 
      subtitle: 'Overview and context',
      description: 'A comprehensive introduction to the document, providing background information and setting the context for the main discussion.',
      audioFile: audio1
    },
    { 
      title: 'Section 2', 
      subtitle: 'Key concepts',
      description: 'Explores fundamental concepts and terminology essential for understanding the document content.',
      audioFile: audio2
    },
    { 
      title: 'Section 3', 
      subtitle: 'Main arguments',
      description: 'Presents the core arguments and key points, supported by evidence and detailed explanations.',
      audioFile: audio3
    },
    { 
      title: 'Section 4', 
      subtitle: 'Analysis',
      description: 'In-depth analysis of the findings, including data interpretation and critical evaluation.',
      audioFile: audio4
    },
    { 
      title: 'Section 5', 
      subtitle: 'Discussion',
      description: 'Examines implications of the findings and connects different aspects of the analysis.',
      audioFile: audio5
    },
    { 
      title: 'Summary', 
      subtitle: 'Key takeaways',
      description: 'Concise summary of the main points and conclusions drawn from the document.',
      audioFile: audio6
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left side - PDF viewer */}
          <div className="w-1/2">
            <div className="h-[calc(100vh-12rem)] bg-gray-800 rounded-lg shadow-lg p-4">
              <iframe
                src={documentPdf}
                className="w-full h-full rounded-lg"
                title="PDF Preview"
              />
            </div>
          </div>

          {/* Right side - Audio players */}
          <div className="w-1/2">
            <div className="space-y-4">
              {audioSections.map((section, index) => (
                <AudioPlayer
                  key={index}
                  title={section.title}
                  subtitle={section.subtitle}
                  description={section.description}
                  audioFile={section.audioFile}
                  isExpanded={expandedPlayer === index}
                  onToggle={() => setExpandedPlayer(expandedPlayer === index ? null : index)}
                  isPlaying={playingPlayer === index}
                  onPlayPause={() => setPlayingPlayer(playingPlayer === index ? null : index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;