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
    { 
      title: 'Introduction', 
      subtitle: 'Overview and context',
      description: 'A comprehensive introduction to the document, providing background information and setting the context for the main discussion.'
    },
    { 
      title: 'Section 2', 
      subtitle: 'Key concepts',
      description: 'Explores fundamental concepts and terminology essential for understanding the document content.'
    },
    { 
      title: 'Section 3', 
      subtitle: 'Main arguments',
      description: 'Presents the core arguments and key points, supported by evidence and detailed explanations.'
    },
    { 
      title: 'Section 4', 
      subtitle: 'Analysis',
      description: 'In-depth analysis of the findings, including data interpretation and critical evaluation.'
    },
    { 
      title: 'Section 5', 
      subtitle: 'Discussion',
      description: 'Examines implications of the findings and connects different aspects of the analysis.'
    },
    { 
      title: 'Summary', 
      subtitle: 'Key takeaways',
      description: 'Concise summary of the main points and conclusions drawn from the document.'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
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
              <div className="h-[calc(100vh-12rem)] bg-gray-800 rounded-lg shadow-lg p-4">
                <iframe
                  src={URL.createObjectURL(selectedFile)}
                  className="w-full h-full rounded-lg"
                  title="PDF Preview"
                />
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
                  description={section.description}
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