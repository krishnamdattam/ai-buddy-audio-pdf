import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import documentPdf from '../assets/pdf/document.pdf?url';
import audio1 from '../assets/audio/new1.mp3';
import audio2 from '../assets/audio/new2.mp3';
import audio3 from '../assets/audio/new3.mp3';
import audio4 from '../assets/audio/new4.mp3';
import audio5 from '../assets/audio/new5.mp3';
import audio6 from '../assets/audio/new6.mp3';
import 'pdfjs-dist/web/pdf_viewer.css';

interface Note {
  sectionId: number;
  content: string;
  timestamp: string;
}

const Index = () => {
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
  const [playingPlayer, setPlayingPlayer] = useState<number | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [currentNoteSection, setCurrentNoteSection] = useState<number | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('audioSectionNotes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('audioSectionNotes', JSON.stringify(notes));
  }, [notes]);

  const handleOpenNoteDialog = (sectionIndex: number) => {
    const existingNote = notes.find(note => note.sectionId === sectionIndex);
    setNoteContent(existingNote?.content || '');
    setCurrentNoteSection(sectionIndex);
    setIsNoteDialogOpen(true);
  };

  const handleSaveNote = () => {
    if (currentNoteSection === null) return;

    const newNote: Note = {
      sectionId: currentNoteSection,
      content: noteContent,
      timestamp: new Date().toISOString()
    };

    setNotes(prevNotes => {
      const noteIndex = prevNotes.findIndex(note => note.sectionId === currentNoteSection);
      if (noteIndex >= 0) {
        const updatedNotes = [...prevNotes];
        updatedNotes[noteIndex] = newNote;
        return updatedNotes;
      }
      return [...prevNotes, newNote];
    });

    setIsNoteDialogOpen(false);
    setNoteContent('');
    setCurrentNoteSection(null);
  };

  const audioSections = [
    { 
      title: 'Introduction', 
      subtitle: 'Overview and context',
      description: 'A comprehensive introduction to the document, providing background information and setting the context for the main discussion.',
      audioFile: audio1,
      pdfPage: 5
    },
    { 
      title: 'Section 2', 
      subtitle: 'Key concepts',
      description: 'Explores fundamental concepts and terminology essential for understanding the document content.',
      audioFile: audio2,
      pdfPage: 6
    },
    { 
      title: 'Section 3', 
      subtitle: 'Main arguments',
      description: 'Presents the core arguments and key points, supported by evidence and detailed explanations.',
      audioFile: audio3,
      pdfPage: 19
    },
    { 
      title: 'Section 4', 
      subtitle: 'Analysis',
      description: 'In-depth analysis of the findings, including data interpretation and critical evaluation.',
      audioFile: audio4,
      pdfPage: 28
    },
    { 
      title: 'Section 5', 
      subtitle: 'Discussion',
      description: 'Examines implications of the findings and connects different aspects of the analysis.',
      audioFile: audio5,
      pdfPage: 29
    },
    { 
      title: 'Summary', 
      subtitle: 'Key takeaways',
      description: 'Concise summary of the main points and conclusions drawn from the document.',
      audioFile: audio6,
      pdfPage: 44
    },
  ];

  const handleAudioPlay = (index: number) => {
    setPlayingPlayer(index);
  };

  const pdfViewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(window.location.origin + documentPdf)}`;

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white text-center">
            Learn from the Experts
          </h1>
          <p className="text-xl text-gray-200 text-center mt-2">
            Interactive audio guides with detailed explanations
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          <div className="w-2/3">
            <div className="h-[calc(100vh-12rem)] bg-gray-800 rounded-lg shadow-lg p-4">
              <iframe
                ref={iframeRef}
                src={pdfViewerUrl}
                className="w-full h-full rounded-lg"
                title="PDF Preview"
              />
            </div>
          </div>

          <div className="w-1/3">
            <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
              {audioSections.map((section, index) => (
                <div 
                  key={index}
                  className={`bg-gray-800 rounded-lg p-3 transition-all duration-200 ${
                    expandedPlayer === index ? 'ring-2 ring-purple-500' : ''
                  } ${
                    playingPlayer === index ? 'animate-glow relative' : ''
                  }`}
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
                        onClick={() => setExpandedPlayer(expandedPlayer === index ? null : index)}
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
                            onPlay={() => handleAudioPlay(index)}
                            onPause={() => setPlayingPlayer(null)}
                          >
                            <source src={section.audioFile} type="audio/mpeg" />
                          </audio>
                          <button
                            onClick={() => handleOpenNoteDialog(index)}
                            className="flex items-center gap-2 px-3 py-1 bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="text-sm text-white">Notes</span>
                          </button>
                        </div>
                        {notes.find(note => note.sectionId === index) && (
                          <div className="mt-2 p-3 bg-gray-700/50 rounded-md">
                            <p className="text-sm text-gray-300">{notes.find(note => note.sectionId === index)?.content}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Note Dialog */}
      {isNoteDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">
              Add Notes for {currentNoteSection !== null ? audioSections[currentNoteSection].title : ''}
            </h3>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full h-40 bg-gray-700 text-white rounded-md p-3 mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Write your notes here..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsNoteDialogOpen(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;