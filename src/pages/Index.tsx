import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AudioSection from '../components/AudioSection';
import { supabase } from '@/integrations/supabase/client';
import type { Note } from '@/types/notes';
import 'pdfjs-dist/web/pdf_viewer.css';
import { Search, Settings, LogOut, FileText, Clock, BookOpen, MessageCircle, Send, X, Maximize2, Minimize2, ChevronLeft, Edit, Home, Presentation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ChatBot from '../components/ChatBot';

// Audio files will be imported after you upload them
const audioPlaceholder = '';

interface CourseDialogue {
  expert: string;
  learner: string;
}

interface CourseSection {
  title: string;
  dialogues: CourseDialogue[];
}

interface CourseState {
  courseName: string;
  template?: string;
  persona?: string;
  files?: string[];
  sections: CourseSection[];
  audioFiles: { fileName: string; sectionTitle: string }[];
}

export default function Index() {
  const location = useLocation();
  const navigate = useNavigate();
  const courseState = location.state as CourseState;
  const [isLoading, setIsLoading] = useState(true);
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isPdfFullScreen, setIsPdfFullScreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<{
    title: string;
    duration: string;
    progress: number;
    currentTime: number;
    isPlaying: boolean;
    index: number;
    audioElement?: HTMLAudioElement;
  } | null>(null);
  const [audioSections, setAudioSections] = useState<Array<{
    title: string;
    subtitle: string;
    description: string;
    audioFile: string;
    pdfPage: number;
    duration: string;
  }>>([]);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [courseData, setCourseData] = useState<any>(null);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/signin');
          return;
        }

        // Check for state in location or session storage
        if (!location.state) {
          const savedState = sessionStorage.getItem('navigationState');
          if (savedState) {
            const parsedState = JSON.parse(savedState);
            if (parsedState.courseName && parsedState.sections && parsedState.files) {
              // Clear the saved state to prevent reuse
              sessionStorage.removeItem('navigationState');
              // Update location state
              navigate('.', { state: parsedState, replace: true });
              return;
            }
          }
          // If no state is available, redirect to dashboard
          console.error('No course data available');
          toast.error('Course data not available');
          navigate('/dashboard');
          return;
        }

        // Validate required state data
        if (!location.state?.courseName || !location.state?.sections || !location.state?.files) {
          console.error('Invalid course data');
          toast.error('Invalid course data');
          navigate('/dashboard');
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error during auth check:', error);
        toast.error('Authentication error');
        navigate('/signin');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/signin', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.state]);

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
    const existingNote = notes.find(note => note.section_index === sectionIndex);
    setNoteContent(existingNote?.content || '');
    setCurrentNoteSection(sectionIndex);
    setIsNoteDialogOpen(true);
  };

  const handleSaveNote = () => {
    if (currentNoteSection === null || !courseState?.courseName) return;

    const timestamp = Date.now();
    const newNote: Note = {
      id: `note_${timestamp}`,
      user_id: 'default_user', // This should be replaced with actual user ID
      course_name: courseState.courseName,
      section_index: currentNoteSection,
      content: noteContent,
      timestamp: timestamp,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setNotes(prevNotes => {
      const noteIndex = prevNotes.findIndex(note => note.section_index === currentNoteSection);
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

  // Load audio sections based on course data
  useEffect(() => {
    if (!courseState?.courseName || !courseState?.audioFiles) {
      console.log('No course data found, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }

    // Set the PDF URL to use backend endpoint with the correct PDF filename
    const pdfFilename = courseState.files?.[0]; // Get the first PDF file from the files array
    if (!pdfFilename) {
      console.error('No PDF file found in course data');
      toast.error('PDF file not found');
      return;
    }

    // Log the PDF URL for debugging
    const pdfUrl = `http://localhost:5001/api/pdf/${courseState.courseName}/${pdfFilename}`;
    console.log('Setting PDF URL:', pdfUrl);
    setPdfUrl(pdfUrl);

    const loadAudioSections = async () => {
      try {
        // Transform the audio files data into sections
        const sections = await Promise.all(courseState.audioFiles.map(async (audioFile, index) => {
          const sectionNumber = index + 1;
          
          // Remove the section number prefix and format the title
          const displayTitle = audioFile.sectionTitle.replace(/^\d+\.\s*/, '');
          
          // Use backend endpoint for audio files with correct path structure
          const audioPath = `http://localhost:5001/api/audio/${courseState.courseName}/${audioFile.fileName}`;
          
          // Create audio element to get duration
          const audio = new Audio(audioPath);
          
          // Wait for metadata to load to get duration
          const duration = await new Promise<string>((resolve) => {
            audio.addEventListener('loadedmetadata', () => {
              const minutes = Math.floor(audio.duration / 60);
              const seconds = Math.floor(audio.duration % 60);
              resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            });
            
            // Handle errors
            audio.addEventListener('error', () => {
              console.error(`Error loading audio file: ${audioPath}`);
              resolve('00:00');
              toast.error(`Failed to load audio for section ${sectionNumber}: ${displayTitle}`);
            });
          });

          return {
            title: displayTitle,
            subtitle: `Section ${sectionNumber}`,
            description: `Audio lesson for ${displayTitle}`,
            audioFile: audioPath,
            pdfPage: sectionNumber,
            duration
          };
        }));

        console.log('Loaded audio sections:', sections);
        setAudioSections(sections);
        setIsLoading(false);
      } catch (error) {
        console.error('Error setting up audio sections:', error);
        toast.error('Failed to load course audio files');
        navigate('/dashboard');
      }
    };

    loadAudioSections();
  }, [courseState, navigate]);

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

  // Update audio element properties when volume, mute, or speed changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [volume, isMuted, playbackSpeed]);

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    setIsMuted(value === 0);
    if (audioRef.current) {
      audioRef.current.volume = value;
      // Store the volume preference
      localStorage.setItem('audioVolume', value.toString());
    }
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (audioRef.current) {
      if (newMutedState) {
        audioRef.current.volume = 0;
      } else {
        audioRef.current.volume = volume;
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setCurrentlyPlaying(prev => prev ? {
        ...prev,
        progress,
        currentTime: audioRef.current!.currentTime
      } : null);
    }
  };

  const handleSeek = (value: number) => {
    if (audioRef.current) {
      const newTime = (value / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setCurrentlyPlaying(prev => prev ? {
        ...prev,
        progress: value,
        currentTime: newTime
      } : null);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAudioPlay = (index: number) => {
    // If we're already playing this audio, just resume it
    if (currentlyPlaying && currentlyPlaying.index === index && audioRef.current) {
      audioRef.current.play();
      setPlayingPlayer(index);
      setCurrentlyPlaying(prev => ({ ...prev!, isPlaying: true }));
      return;
    }

    // Otherwise start a new audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioSections[index].audioFile);
    // Apply current volume settings to new audio
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackSpeed;
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.play();

    audioRef.current = audio;
    setPlayingPlayer(index);
    setCurrentlyPlaying({
      title: audioSections[index].title,
      duration: audioSections[index].duration,
      progress: 0,
      currentTime: 0,
      isPlaying: true,
      index: index,
      audioElement: audio
    });
  };

  const handleAudioPause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingPlayer(null);
      setCurrentlyPlaying(prev => prev ? { 
        ...prev, 
        isPlaying: false,
        progress: (audioRef.current!.currentTime / audioRef.current!.duration) * 100,
        currentTime: audioRef.current!.currentTime
      } : null);
    }
  };

  // Add an effect to sync audio state when visibility changes
  useEffect(() => {
    if (!isPdfFullScreen && audioRef.current) {
      const isPlaying = !audioRef.current.paused;
      if (currentlyPlaying) {
        setCurrentlyPlaying(prev => ({
          ...prev!,
          isPlaying,
          progress: (audioRef.current!.currentTime / audioRef.current!.duration) * 100,
          currentTime: audioRef.current!.currentTime
        }));
      }
      if (isPlaying) {
        setPlayingPlayer(currentlyPlaying?.index ?? null);
      }
    }
  }, [isPdfFullScreen]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, []);

  const getLengthLabel = (value: number) => {
    if (value <= 33) return 'Short';
    if (value <= 66) return 'Medium';
    return 'Long';
  };

  useEffect(() => {
    if (courseState?.sections) {
      console.log('Course sections available:', courseState.sections);
    }
  }, [courseState]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Add scroll to bottom effect for chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { text: newMessage, isUser: true }]);
    const userMessage = newMessage;
    setNewMessage('');

    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: "I'm here to help you with your course. What would you like to know?", 
        isUser: false 
      }]);
    }, 1000);
  };

  // Add this function to handle PDF full-screen toggle
  const handlePdfFullScreenToggle = (fullScreen: boolean) => {
    setIsPdfFullScreen(fullScreen);
    // When returning from full screen, ensure the UI state matches the audio state
    if (!fullScreen && audioRef.current) {
      // Update the playing state based on whether audio is actually playing
      const isPlaying = !audioRef.current.paused;
      if (currentlyPlaying) {
        setCurrentlyPlaying(prev => ({
          ...prev!,
          isPlaying,
          progress: (audioRef.current!.currentTime / audioRef.current!.duration) * 100,
          currentTime: audioRef.current!.currentTime
        }));
      }
      // Update the playing player state to match
      if (isPlaying && currentlyPlaying) {
        setPlayingPlayer(currentlyPlaying.index);
      }
    }
  };

  // Add useEffect to initialize volume from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('audioVolume');
    if (savedVolume !== null) {
      const parsedVolume = parseFloat(savedVolume);
      setVolume(parsedVolume);
      if (audioRef.current) {
        audioRef.current.volume = parsedVolume;
      }
    }
  }, []);

  const handleEditCourseCanvas = () => {
    if (!courseData) {
      toast.error('Course data not loaded yet');
      return;
    }

    // Transform the course data into the expected format
    const transformedData = {
      courseName: courseState.courseName,
      template: courseState.template || '',
      persona: courseState.persona || '',
      files: courseState.files || [],
      processedSections: courseData.map((section: any) => ({
        title: section.title,
        content: section.content || '',
        metadata: section.metadata || {},
        dialogues: section.dialogues || []
      }))
    };

    navigate('/course-canvas', { 
      state: transformedData,
      replace: true 
    });
  };

  const handlePlayCourse = (course: {
    title: string;
    sections: CourseSection[];
    audioFiles: Array<{ fileName: string; sectionTitle: string; }>;
  }) => {
    if (!courseData) {
      toast.error('Course data not loaded yet');
      return;
    }

    // Transform the course data into the expected format
    const transformedData = {
      courseName: course.title,
      sections: courseData.map((section: any) => ({
        title: section.title,
        dialogues: section.dialogues || []
      })),
      audioFiles: course.audioFiles
    };

    navigate('/course-canvas', { 
      state: transformedData,
      replace: true 
    });
  };

  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseState?.courseName) {
        console.log('No course data found, redirecting to dashboard');
        navigate('/dashboard');
        return;
      }

      try {
        // Fetch course data from the backend
        const response = await fetch(`http://localhost:5001/api/courses/${courseState.courseName}`);
        if (!response.ok) {
          throw new Error('Failed to load course data');
        }
        const data = await response.json();
        console.log('Course data loaded:', data);
        setCourseData(data);
      } catch (error) {
        console.error('Error loading course data:', error);
        toast.error('Failed to load course data');
        navigate('/dashboard');
      }
    };

    loadCourseData();
  }, [courseState?.courseName, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Enhanced background effects */}
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rotate-45 transform scale-150" />

      {isLoading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-white font-medium"
            >
              Loading audio course...
            </motion.p>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Enhanced Header */}
          <motion.header 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50"
          >
            <div className="px-6 py-2 flex justify-between items-center">
              {/* Logo */}
              <div 
                onClick={() => navigate('/dashboard')} 
                className="cursor-pointer"
              >
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                  AI-Buddy
                </h1>
              </div>

              {/* Search and Profile Section */}
              <div className="flex items-center space-x-4">
                <div className="relative w-80">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input 
                    placeholder="Search courses..."
                    className="pl-8 py-1 h-8 bg-gray-800/50 border-gray-700 text-white w-full text-sm"
                  />
                </div>
                
                <span className="text-gray-300 text-sm">Welcome Vijay</span>
                
                {/* Profile Dropdown */}
                <div className="relative group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer">
                    <span className="text-white text-sm font-medium">V</span>
                  </div>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 py-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <button 
                      className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center text-sm"
                      onClick={() => console.log('Settings clicked')}
                    >
                      <Settings className="h-3.5 w-3.5 mr-2" />
                      Settings
                    </button>
                    <button 
                      className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center text-sm"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-3.5 w-3.5 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.header>
          
          {/* Reduced Hero Section with Integrated Controls */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600 to-indigo-700 py-3 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-grid-white/5 bg-[size:20px_20px]" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.span
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-gray-200 font-medium"
                  >
                    Topic:
                  </motion.span>
                  <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-2xl font-bold text-white"
                  >
                    {courseState?.courseName || "ITIL"}
                  </motion.h1>
                </div>

                <div className="flex items-center gap-6">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center gap-6"
                  >
                    <div className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">{formatTotalDuration(totalDuration)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-sm font-medium">{audioSections.length} Sections</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Modified Split Layout with Full Screen Support */}
          <div className={`flex ${isPdfFullScreen ? 'h-[calc(100vh-6rem)]' : 'h-[calc(100vh-12rem)]'} bg-gray-900/50 backdrop-blur-sm`}>
            {/* PDF Viewer - Left Side */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={`${isPdfFullScreen ? 'flex-1' : 'w-1/2'} border-r border-gray-700/50 transition-all duration-300`}
            >
              <div className="h-full rounded-lg overflow-hidden backdrop-blur-sm shadow-xl relative">
                {/* Loading indicator */}
                {isPdfLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
                
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  className="w-full h-full"
                  onLoad={() => setIsPdfLoading(false)}
                  onError={() => {
                    setIsPdfLoading(false);
                    setPdfLoadError(true);
                  }}
                >
                  {pdfLoadError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
                      <a 
                        href={pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        Open PDF in new tab
                      </a>
                    </div>
                  )}
                </object>
              </div>
            </motion.div>

            {/* Audio Sections - Right Side */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={`${isPdfFullScreen ? 'w-[320px]' : 'w-1/2'} overflow-y-auto px-4 py-4 custom-scrollbar bg-gray-900/80 transition-all duration-300`}
            >
              <div className="space-y-3">
                {audioSections.map((section, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-700/50 hover:border-purple-500/30 transition-colors shadow-lg hover:shadow-purple-500/10"
                  >
                    <AudioSection
                      section={section}
                      index={index}
                      expandedPlayer={expandedPlayer}
                      playingPlayer={playingPlayer}
                      notes={notes}
                      onExpand={setExpandedPlayer}
                      onPlay={handleAudioPlay}
                      onPause={handleAudioPause}
                      onOpenNoteDialog={handleOpenNoteDialog}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Floating Bottom Bar - Adjusted position */}
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex items-center gap-3 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 backdrop-blur-sm rounded-full border border-purple-500/20 px-4 py-2 shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="w-9 h-9 rounded-full bg-gray-800/50 text-gray-300 hover:text-white hover:bg-purple-500/20 hover:shadow-lg transition-all duration-300"
                title="Back to Dashboard"
              >
                <Home className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/course-canvas', { state: courseState })}
                className="w-9 h-9 rounded-full bg-gray-800/50 text-gray-300 hover:text-white hover:bg-purple-500/20 hover:shadow-lg transition-all duration-300"
                title="Edit Course Canvas"
              >
                <Edit className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  const toastId = 'generating-presentation';
                  try {
                    if (!courseState?.courseName) {
                      toast.error("Course name not found");
                      return;
                    }

                    // Check if presentation already exists
                    const coursesList = await fetch('http://localhost:5001/api/courses').then(res => res.json());
                    const course = coursesList.find((c: any) => c.name === courseState.courseName);
                    
                    if (course?.presentationAvailable) {
                      // If presentation exists, navigate directly to presentation canvas
                      navigate('/presentation-canvas', { 
                        state: { 
                          courseName: courseState.courseName,
                          presentationFile: `${courseState.courseName}_presentation.json`
                        }
                      });
                      return;
                    }

                    toast.loading("Generating presentation...", { id: toastId });

                    const response = await fetch('http://localhost:5001/api/generate-presentation', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        course_name: courseState.courseName
                      })
                    });

                    if (!response.ok) {
                      throw new Error('Failed to generate presentation');
                    }

                    const data = await response.json();
                    
                    if (data.status === 'success') {
                      toast.dismiss(toastId);
                      toast.success("Presentation generated successfully!");
                      // Navigate to presentation canvas with the generated data
                      navigate('/presentation-canvas', { 
                        state: { 
                          courseName: courseState.courseName,
                          presentationFile: data.presentation_file
                        }
                      });
                    } else {
                      throw new Error(data.error || 'Unknown error occurred');
                    }
                  } catch (error) {
                    toast.dismiss(toastId);
                    toast.error(error.message || "Failed to generate presentation");
                    console.error('Error generating presentation:', error);
                  }
                }}
                className="w-9 h-9 rounded-full bg-gray-800/50 text-gray-300 hover:text-white hover:bg-emerald-500/20 hover:shadow-lg transition-all duration-300 relative presentation-glow group"
                title="Transform to Presentation"
              >
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md animate-pulse-slow" />
                <Presentation className="h-4 w-4 text-emerald-400 group-hover:text-emerald-300 transition-colors relative z-10" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handlePdfFullScreenToggle(!isPdfFullScreen)}
                className="w-9 h-9 rounded-full bg-gray-800/50 text-gray-300 hover:text-white hover:bg-purple-500/20 hover:shadow-lg transition-all duration-300"
                title={isPdfFullScreen ? "Shrink PDF View" : "Widen PDF View"}
              >
                {isPdfFullScreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Enhanced Footer */}
          <motion.footer 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 h-6 border-t border-gray-800/50 bg-gray-900/30 backdrop-blur-sm z-40 flex items-center"
          >
            <div className="w-full px-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="hover:text-gray-300 transition-colors">© 2025 AI-Buddy</span>
                  <div className="h-2 w-px bg-gray-700/50" />
                  <span className="text-gray-500">v0.0.9</span>
                </div>
                <a 
                  href="mailto:vijay.betigiri@swisscom.com"
                  className="text-[10px] text-gray-400 hover:text-gray-300 transition-colors"
                >
                  Created by Vijay Betigiri
                </a>
              </div>
            </div>
          </motion.footer>

          {/* Enhanced Notes Dialog */}
          {isNoteDialogOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-800/90 rounded-xl p-6 w-full max-w-md border border-gray-700 shadow-2xl"
              >
                <h3 className="text-xl font-semibold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                  Add Notes for {currentNoteSection !== null ? audioSections[currentNoteSection].title : ''}
                </h3>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full h-40 bg-gray-700/50 text-white rounded-lg p-3 mb-4 focus:ring-2 focus:ring-purple-500 outline-none border border-gray-600 hover:border-purple-500/50 transition-colors"
                  placeholder="Write your notes here..."
                />
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => setIsNoteDialogOpen(false)}
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-gray-700/50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveNote}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-indigo-600 hover:to-purple-600 transition-all duration-300"
                  >
                    Save Notes
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Chat Box */}
          <div className="fixed bottom-20 right-12 z-50">
            <ChatBot courseName={courseState?.courseName} />
          </div>

          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(17, 24, 39, 0.7);
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(139, 92, 246, 0.5);
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(139, 92, 246, 0.7);
            }

            /* Add a subtle line between sections when hovering */
            .custom-scrollbar > div > div:not(:last-child)::after {
              content: '';
              display: block;
              height: 1px;
              margin: 0.75rem 0;
              background: linear-gradient(to right, transparent, rgba(139, 92, 246, 0.2), transparent);
            }

            @keyframes pulse-slow {
              0%, 100% {
                opacity: 0.2;
                transform: scale(1);
              }
              50% {
                opacity: 0.5;
                transform: scale(1.1);
              }
            }

            .animate-pulse-slow {
              animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
          `}</style>
        </>
      )}
    </div>
  );
}
