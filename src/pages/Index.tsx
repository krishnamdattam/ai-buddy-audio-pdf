import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AudioSection from '../components/AudioSection';
import { supabase } from '@/integrations/supabase/client';
import documentPdf from '../assets/pdf/document.pdf?url';
import audio1 from '../assets/audio/new1.mp3';
import audio2 from '../assets/audio/new2.mp3';
import audio3 from '../assets/audio/new3.mp3';
import audio4 from '../assets/audio/new4.mp3';
import audio5 from '../assets/audio/new5.mp3';
import audio6 from '../assets/audio/new6.mp3';
import type { Note } from '@/types/notes';
import 'pdfjs-dist/web/pdf_viewer.css';

const Index = () => {
  const navigate = useNavigate();
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
  const [playingPlayer, setPlayingPlayer] = useState<number | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [currentNoteSection, setCurrentNoteSection] = useState<number | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [courseType, setCourseType] = useState('audio');
  const [audioLength, setAudioLength] = useState(50);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const [courseTemplate, setCourseTemplate] = useState('step-by-step');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/signin');
      }
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/signin');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const savedNotes = localStorage.getItem('audioSectionNotes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

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
      description: 'An overview of schemas in ky2help®, detailing their role in structuring the CMDB and managing configuration items with inheritance and lifecycle definitions.',
      audioFile: audio1,
      pdfPage: 5,
      duration: '5:30'
    },
    { 
      title: 'Section 2', 
      subtitle: 'Schemas',
      description: 'Defines schemas as the backbone of CMDB, detailing their structure, inheritance, and lifecycle management in ky2help®.',
      audioFile: audio2,
      pdfPage: 6,
      duration: '8:15'
    },
    { 
      title: 'Section 3', 
      subtitle: 'Product Catalog',
      description: 'Explains the product catalog’s structure, product management processes, schema hierarchy, and template utility, with detailed steps and examples for efficient configuration.',
      audioFile: audio3,
      pdfPage: 19,
      duration: '12:45'
    },
    { 
      title: 'Section 4', 
      subtitle: 'Relationships',
      description: 'Explores relationships in configuration management, emphasizing dependency mapping and evaluating impacts for troubleshooting and audits.',
      audioFile: audio4,
      pdfPage: 28,
      duration: '10:20'
    },
    { 
      title: 'Section 5', 
      subtitle: 'Configuration Items',
      description: 'Details Configuration Items (CIs), their management, roles, lifecycle, and downtime tracking.',
      audioFile: audio5,
      pdfPage: 29,
      duration: '7:50'
    },
    { 
      title: 'Summary', 
      subtitle: 'Key takeaways and Quiz',
      description: 'Final session reviewing Asset and Configuration Management concepts with a quiz to reinforce the concepts.',
      audioFile: audio6,
      pdfPage: 44,
      duration: '4:20'
    },
  ];

  const totalDuration = audioSections.reduce((acc, section) => {
    const [mins, secs] = section.duration.split(':').map(Number);
    return acc + mins * 60 + secs;
  }, 0);

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 
      ? `(${hours}h ${minutes}m)`
      : `(${minutes} Min)`;
  };

  const handleAudioPlay = (index: number) => {
    setPlayingPlayer(index);
  };

  const pdfViewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(window.location.origin + documentPdf)}`;

  const getLengthLabel = (value: number) => {
    if (value <= 33) return 'Short';
    if (value <= 66) return 'Medium';
    return 'Long';
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white text-center">
            Learn from the Experts (PoC)
          </h1>
          <p className="text-xl text-gray-200 text-center mt-2">
            Step-by-step, Personalised learning audio courses on any topic
          </p>
          <p className="text-md text-gray-200 text-center mt-1">
            Total Duration: {formatTotalDuration(totalDuration)}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => setIsPersonalizationOpen(!isPersonalizationOpen)}
          className="w-full bg-gray-800 rounded-lg shadow-lg p-4 mb-2 flex items-center justify-between text-white hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <h2 className="text-2xl font-semibold">Personalise Course</h2>
          </div>
          <svg 
            className={`w-6 h-6 transform transition-transform duration-200 ${isPersonalizationOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div 
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isPersonalizationOpen 
              ? 'max-h-[1000px] opacity-100' 
              : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-gray-800 rounded-lg shadow-lg p-4">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="col-span-1">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-gray-700 text-white rounded-md pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Username"
                  />
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="col-span-1">
                <div className="relative">
                  <select className="w-full bg-gray-700 text-white rounded-md pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none appearance-none">
                    <option value="" disabled>Experience Level</option>
                    <option value="beginner">👶 Beginner</option>
                    <option value="intermediate">👨‍💻 Intermediate</option>
                    <option value="advanced">🎓 Advanced</option>
                  </select>
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="col-span-1">
                <div className="relative">
                  <select
                    value={courseTemplate}
                    onChange={(e) => setCourseTemplate(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-md pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none appearance-none"
                  >
                    <option value="" disabled>Course Template</option>
                    <option value="step-by-step">📝 Step-by-step Guide</option>
                    <option value="classroom">🎓 Classroom Lecture</option>
                    <option value="podcast">🎧 Podcast Overview</option>
                    <option value="research">🔍 Research Analysis</option>
                  </select>
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="col-span-1">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-sm text-gray-300 rounded-md hover:bg-gray-600 transition-all duration-200 focus:ring-2 focus:ring-purple-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4">
                <div className="flex items-center gap-3 bg-gray-700 rounded-md px-3 py-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audioLength}
                    onChange={(e) => setAudioLength(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <span className="text-sm text-gray-300 min-w-[48px]">
                    {getLengthLabel(audioLength)}
                  </span>
                </div>
              </div>

              <div className="col-span-4">
                <div className="flex items-center gap-2 bg-gray-700 p-1 rounded-md">
                  <button
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded transition-all duration-200 ${
                      courseType === 'audio' 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-300 hover:text-white'
                    }`}
                    onClick={() => setCourseType('audio')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728" />
                    </svg>
                    Audio
                  </button>
                  <button
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded transition-all duration-200 ${
                      courseType === 'video' 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-300 hover:text-white'
                    }`}
                    onClick={() => setCourseType('video')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Video
                  </button>
                </div>
              </div>

              <div className="col-span-4">
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Personalise Course
                </button>
              </div>
            </div>
          </div>
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
                <AudioSection
                  key={index}
                  section={section}
                  index={index}
                  expandedPlayer={expandedPlayer}
                  playingPlayer={playingPlayer}
                  notes={notes}
                  onExpand={setExpandedPlayer}
                  onPlay={handleAudioPlay}
                  onPause={() => setPlayingPlayer(null)}
                  onOpenNoteDialog={handleOpenNoteDialog}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

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
