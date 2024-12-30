import React, { useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import PDFUpload from '../components/PDFUpload';
import AudioPlayer from '../components/AudioPlayer';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
  const [playingPlayer, setPlayingPlayer] = useState<number | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    console.log('Selected file:', file.name);
  }, []);

  const audioSections = [
    { title: 'Executive Summary', subtitle: 'Key points and findings' },
    { title: 'Chapter 1 Overview', subtitle: 'Introduction and context' },
    { title: 'Main Arguments', subtitle: 'Core concepts explained' },
    { title: 'Data Analysis', subtitle: 'Key metrics and insights' },
    { title: 'Conclusions', subtitle: 'Final thoughts and recommendations' },
    { title: 'Next Steps', subtitle: 'Action items and follow-ups' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left side - PDF section */}
          <div className="w-1/2">
            {!selectedFile ? (
              <div className="h-[calc(100vh-12rem)]">
                <PDFUpload onFileSelect={handleFileSelect} />
              </div>
            ) : (
              <div className="h-[calc(100vh-12rem)] bg-white rounded-lg shadow-sm p-4">
                <p className="text-center text-gray-600">
                  PDF Preview: {selectedFile.name}
                </p>
              </div>
            )}
          </div>

          {/* Right side - Audio players */}
          <div className="w-1/2">
            <div className="space-y-4">
              {audioSections.map((section, index) => (
                <AudioPlayer
                  key={index}
                  title={section.title}
                  subtitle={section.subtitle}
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