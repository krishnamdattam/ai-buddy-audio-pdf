import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Settings, LogOut, FileText, Clock, BookOpen, MessageCircle, Send, X, Maximize2, Minimize2, ChevronLeft, Edit, Volume2, VolumeX, LayoutDashboard, Headphones, Tv, Play, Pause, SkipBack, SkipForward, Bookmark, FileUp, ThumbsUp, ThumbsDown, Share2, Flag, MoreVertical, MessageSquare, Home } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ChatBot from '@/components/ChatBot';
import { supabase } from '@/integrations/supabase/client';
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VideoPlayerProps {}

// Add Note interface
interface Note {
  id: string;
  content: string;
  timestamp: number;
  user_id: string;
  course_name: string;
  section_index: number;
  created_at: string;
  updated_at: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isPdfFullScreen, setIsPdfFullScreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isVolumeControlVisible, setIsVolumeControlVisible] = useState(false);
  const [showBookmark, setShowBookmark] = useState(false);
  const [isPdfVisible, setIsPdfVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState('');

  // Constants for video timing
  const TITLE_DURATION = 5; // 5 seconds for title
  const SEPARATOR_DURATION = 5; // 5 seconds for each section separator

  const getVideoUrl = (courseName: string) => {
    return `/video/${courseName}.mp4`;
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/signin', { replace: true });
          return;
        }

        // Validate required state data
        if (!location.state?.courseName || !location.state?.files) {
          toast.error('Invalid course data');
          navigate('/dashboard', { replace: true });
          return;
        }

        // Validate PDF file exists
        const pdfFile = location.state.files[0];
        if (!pdfFile) {
          toast.error('PDF file not found');
          navigate('/dashboard', { replace: true });
          return;
        }

        // Check if video exists
        const videoUrl = getVideoUrl(location.state.courseName);
        const videoExists = await fetch(videoUrl, { method: 'HEAD' })
          .then(response => response.ok)
          .catch(() => false);

        if (!videoExists) {
          toast.error('Video file not found');
          navigate('/dashboard', { replace: true });
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error during auth check:', error);
        toast.error('Authentication error');
        navigate('/signin', { replace: true });
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    setIsMuted(value === 0);
    if (videoRef.current) {
      videoRef.current.volume = value;
    }
  };

  const handleTimeUpdate = (value: number) => {
    if (videoRef.current) {
      const newTime = value * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleFullscreenChange = () => {
    setIsVideoFullscreen(document.fullscreenElement !== null);
  };

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleVideoFullscreen = async () => {
    if (!videoRef.current) return;

    try {
      if (!isVideoFullscreen) {
        if (videoRef.current.requestFullscreen) {
          await videoRef.current.requestFullscreen();
        } else if ((videoRef.current as any).webkitRequestFullscreen) {
          await (videoRef.current as any).webkitRequestFullscreen();
        } else if ((videoRef.current as any).msRequestFullscreen) {
          await (videoRef.current as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      toast.error('Failed to toggle fullscreen');
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
    }
  };

  // Calculate the start time for a given section index
  const calculateSectionStartTime = (sectionIndex: number) => {
    // Start with title duration
    let startTime = TITLE_DURATION;

    // Add initial separator for section 1
    startTime += SEPARATOR_DURATION;

    // For sections after the first, add previous sections' durations and their separators
    if (sectionIndex > 0) {
      for (let i = 0; i < sectionIndex; i++) {
        // Get the dialogue duration for this section
        const sectionDuration = location.state?.sections[i]?.dialogue?.reduce(
          (sum: number, dialog: any) => {
            // Each word takes approximately 0.3 seconds to speak
            return sum + (dialog.text?.split(' ').length * 0.3 || 0);
          },
          0
        ) || 0;

        // Add the section duration and its following separator
        startTime += sectionDuration + SEPARATOR_DURATION;
      }
    }

    return startTime;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <AnimatePresence>
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                Loading video course...
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen relative"
          >
            {/* Floating Action Bar */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-gray-800/90 backdrop-blur-lg rounded-full border border-purple-500/30 p-2 shadow-lg floating-bar-glow">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate('/dashboard')}
                          className="w-10 h-10 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50"
                        >
                          <Home className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="custom-tooltip">
                        <p>Go to Dashboard</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="w-px h-6 bg-gray-700" />

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsPdfVisible(!isPdfVisible)}
                          className={`w-10 h-10 rounded-full transition-all duration-300 ${
                            isPdfVisible 
                              ? 'text-purple-400 bg-purple-500/20 hover:bg-purple-500/30' 
                              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                          }`}
                        >
                          <FileText className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="custom-tooltip">
                        <p>{isPdfVisible ? 'Hide PDF' : 'Show PDF'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="w-px h-6 bg-gray-700" />

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const notesSection = document.querySelector('#notes-section');
                            notesSection?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="w-10 h-10 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50"
                        >
                          <MessageSquare className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="custom-tooltip">
                        <p>Go to Notes</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Header */}
            <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
              <div className="px-4 py-2 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    onClick={() => navigate('/dashboard')} 
                    className="cursor-pointer"
                  >
                    <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                      AI-Buddy
                    </h1>
                  </motion.div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search in video..."
                      className="pl-10 bg-gray-800/50 border-gray-700 text-white w-full transition-all focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-gray-300">Welcome Vijay</span>
                    {/* Profile Dropdown */}
                    <div className="relative group">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer"
                      >
                        <span className="text-white font-medium text-sm">V</span>
                      </motion.div>
                      
                      {/* Dropdown Menu */}
                      <div className="absolute right-0 mt-2 w-48 py-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
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
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <div className="max-w-[1800px] mx-auto px-4 py-4">
              <div className="grid grid-cols-12 gap-6">
                {/* Main Video Area */}
                <div className={`${isPdfVisible ? 'col-span-6' : 'col-span-9'} space-y-4`}>
                  {/* Video Player */}
                  <div className="relative group">
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="aspect-video bg-gray-800 rounded-xl overflow-hidden border border-gray-700/50"
                    >
                      <video
                        ref={videoRef}
                        className="w-full h-full object-contain"
                        onTimeUpdate={handleVideoTimeUpdate}
                        onLoadedMetadata={handleVideoLoadedMetadata}
                        onEnded={handleVideoEnded}
                      >
                        <source 
                          src={getVideoUrl(location.state?.courseName)}
                          type="video/mp4" 
                          onError={(e) => {
                            console.error('Error loading video source:', e);
                            toast.error('Failed to load video');
                          }}
                        />
                        Your browser does not support the video tag.
                      </video>
                      
                      {/* Video Controls */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          {/* Progress Bar */}
                          <div className="relative mb-4">
                            <Slider
                              value={[currentTime / duration]}
                              onValueChange={([value]) => handleTimeUpdate(value)}
                              max={1}
                              step={0.001}
                              className="cursor-pointer"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={skipBackward}
                                className="w-8 h-8 rounded-full text-white hover:bg-white/20"
                              >
                                <SkipBack className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handlePlayPause}
                                className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20"
                              >
                                {isPlaying ? (
                                  <Pause className="h-5 w-5" />
                                ) : (
                                  <Play className="h-5 w-5" />
                                )}
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={skipForward}
                                className="w-8 h-8 rounded-full text-white hover:bg-white/20"
                              >
                                <SkipForward className="h-4 w-4" />
                              </Button>

                              <div className="flex items-center gap-2 ml-2">
                                <span className="text-sm text-white">
                                  {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Volume Control */}
                              <div className="relative group"
                                onMouseEnter={() => setIsVolumeControlVisible(true)}
                                onMouseLeave={() => setIsVolumeControlVisible(false)}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setIsMuted(!isMuted)}
                                  className="w-8 h-8 rounded-full text-white hover:bg-white/20"
                                >
                                  {isMuted || volume === 0 ? (
                                    <VolumeX className="h-4 w-4" />
                                  ) : (
                                    <Volume2 className="h-4 w-4" />
                                  )}
                                </Button>

                                <AnimatePresence>
                                  {isVolumeControlVisible && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: 10 }}
                                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-8 bg-gray-800 rounded-lg p-2 shadow-lg border border-gray-700"
                                    >
                                      <Slider
                                        value={[isMuted ? 0 : volume]}
                                        onValueChange={([value]) => handleVolumeChange(value)}
                                        max={1}
                                        step={0.1}
                                        orientation="vertical"
                                        className="h-24"
                                      />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleVideoFullscreen}
                                className="w-8 h-8 rounded-full text-white hover:bg-white/20"
                              >
                                {isVideoFullscreen ? (
                                  <Minimize2 className="h-4 w-4" />
                                ) : (
                                  <Maximize2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Video Info Section */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                    <h1 className="text-xl font-semibold text-white mb-4">
                      {location.state.courseName}
                    </h1>
                    
                    <div className="flex items-center justify-between border-b border-gray-700 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" className="text-gray-400 hover:text-white gap-2">
                            <ThumbsUp className="h-4 w-4" />
                            <span>Like</span>
                          </Button>
                          <Button variant="ghost" className="text-gray-400 hover:text-white gap-2">
                            <ThumbsDown className="h-4 w-4" />
                            <span>Dislike</span>
                          </Button>
                        </div>
                        <Button variant="ghost" className="text-gray-400 hover:text-white gap-2">
                          <Share2 className="h-4 w-4" />
                          <span>Share</span>
                        </Button>
                        <Button variant="ghost" className="text-gray-400 hover:text-white gap-2">
                          <Flag className="h-4 w-4" />
                          <span>Report</span>
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div id="notes-section" className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-purple-400" />
                          Notes
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsNoteDialogOpen(true)}
                          className="h-8 w-8 rounded-full text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                        >
                          <span className="text-xl font-semibold">+</span>
                        </Button>
                      </div>
                    </div>

                    {/* Notes List */}
                    <div className="space-y-4">
                      {notes.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-400">No notes yet. Add your first note!</p>
                        </div>
                      ) : (
                        notes.map((note) => (
                          <div
                            key={note.id}
                            className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-400">
                                  {formatTime(note.timestamp)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (videoRef.current) {
                                      videoRef.current.currentTime = note.timestamp;
                                    }
                                  }}
                                  className="h-8 w-8 text-gray-400 hover:text-white"
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingNoteId(note.id);
                                    setNoteContent(note.content);
                                    setIsEditingNote(true);
                                  }}
                                  className="h-8 w-8 text-gray-400 hover:text-white"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setNotes(notes.filter((n) => n.id !== note.id));
                                  }}
                                  className="h-8 w-8 text-gray-400 hover:text-white"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-white">{note.content}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Note Dialog */}
                    {isNoteDialogOpen && (
                      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700">
                          <h3 className="text-lg font-semibold text-white mb-4">Add Note</h3>
                          <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter your note..."
                          />
                          <div className="flex justify-end gap-3 mt-4">
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setIsNoteDialogOpen(false);
                                setNoteContent('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={async () => {
                                if (noteContent.trim()) {
                                  const { data: { user } } = await supabase.auth.getUser();
                                  const newNote: Note = {
                                    id: Date.now().toString(),
                                    content: noteContent,
                                    timestamp: videoRef.current?.currentTime || 0,
                                    user_id: user?.id || '',
                                    course_name: location.state?.courseName || '',
                                    section_index: 0, // Default to 0 if no section is selected
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                  };
                                  setNotes([...notes, newNote]);
                                  setIsNoteDialogOpen(false);
                                  setNoteContent('');
                                }
                              }}
                              className="bg-purple-500 hover:bg-purple-600 text-white"
                            >
                              Add Note
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Edit Note Dialog */}
                    {isEditingNote && (
                      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700">
                          <h3 className="text-lg font-semibold text-white mb-4">Edit Note</h3>
                          <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <div className="flex justify-end gap-3 mt-4">
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setIsEditingNote(false);
                                setNoteContent('');
                                setEditingNoteId('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => {
                                if (noteContent.trim()) {
                                  setNotes(
                                    notes.map((note) =>
                                      note.id === editingNoteId
                                        ? { 
                                            ...note, 
                                            content: noteContent,
                                            updated_at: new Date().toISOString()
                                          }
                                        : note
                                    )
                                  );
                                  setIsEditingNote(false);
                                  setNoteContent('');
                                  setEditingNoteId('');
                                }
                              }}
                              className="bg-purple-500 hover:bg-purple-600 text-white"
                            >
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PDF Viewer */}
                {isPdfVisible && (
                  <div className="col-span-6 h-[calc(100vh-8rem)]">
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="w-full h-full bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50"
                    >
                      <iframe
                        src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(`http://localhost:5001/api/pdf/${location.state?.courseName}/${location.state?.files?.[0]}`)}`}
                        className="w-full h-full border-0"
                        title="PDF Document"
                      />
                    </motion.div>
                  </div>
                )}

                {/* Side Panel - Video Index */}
                {!isPdfVisible && (
                  <div className="col-span-3">
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-purple-400" />
                        Course Sections
                      </h3>
                      <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {location.state?.sections?.map((section: any, index: number) => {
                          const startTime = calculateSectionStartTime(index);
                          
                          // Calculate this section's duration
                          const sectionDuration = section.dialogue?.reduce((sum: number, dialog: any) => {
                            return sum + (dialog.text?.split(' ').length * 0.3 || 0);
                          }, 0) || 0;

                          const timeString = formatTime(startTime);

                          return (
                            <motion.button
                              key={index}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                if (videoRef.current) {
                                  videoRef.current.currentTime = startTime;
                                  if (!isPlaying) {
                                    videoRef.current.play();
                                    setIsPlaying(true);
                                  }
                                }
                              }}
                              className={`w-full p-3 rounded-lg ${
                                currentTime >= startTime && currentTime < (startTime + sectionDuration)
                                  ? 'bg-purple-500/20 border border-purple-500/30'
                                  : 'bg-gray-700/50 hover:bg-gray-700'
                              } text-left transition-all duration-200`}
                            >
                              <div className="flex gap-3">
                                <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-gray-700">
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Play className={`h-6 w-6 ${
                                      currentTime >= startTime && currentTime < (startTime + sectionDuration)
                                        ? 'text-purple-400'
                                        : 'text-gray-400'
                                    }`} />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-white line-clamp-2">
                                    {section.title || `Section ${index + 1}`}
                                  </h4>
                                  <p className="text-xs text-gray-400 mt-1">{timeString}</p>
                                  {section.content && (
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                      {section.content}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Add ChatBot */}
            <ChatBot courseName={location.state?.courseName} />

            {/* Enhanced Footer */}
            <footer className="mt-8 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
              <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">© 2025 AI-Buddy</span>
                  <span className="text-sm text-gray-400">Created by Vijay Betigiri</span>
                </div>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }

        @keyframes floatingBarGlow {
          0%, 100% {
            border-color: rgba(139, 92, 246, 0.3);
            box-shadow: 0 0 10px rgba(139, 92, 246, 0.2),
                        0 0 20px rgba(139, 92, 246, 0.1),
                        inset 0 0 15px rgba(139, 92, 246, 0.1);
          }
          50% {
            border-color: rgba(139, 92, 246, 0.5);
            box-shadow: 0 0 15px rgba(139, 92, 246, 0.4),
                        0 0 30px rgba(139, 92, 246, 0.2),
                        inset 0 0 20px rgba(139, 92, 246, 0.2);
          }
        }

        .floating-bar-glow {
          animation: floatingBarGlow 3s ease-in-out infinite;
        }

        /* Custom Tooltip Styles */
        [data-radix-popper-content-wrapper] {
          z-index: 50 !important;
        }

        .custom-tooltip {
          background: linear-gradient(to right, rgb(88, 28, 135), rgb(124, 58, 237)) !important;
          border: 1px solid rgba(139, 92, 246, 0.3) !important;
          color: white !important;
          font-weight: 500 !important;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.2) !important;
          backdrop-filter: blur(8px) !important;
          animation: tooltipGlow 2s ease-in-out infinite !important;
        }

        @keyframes tooltipGlow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(139, 92, 246, 0.2);
          }
          50% {
            box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
          }
        }
      `}</style>
    </div>
  );
}

export default VideoPlayer; 