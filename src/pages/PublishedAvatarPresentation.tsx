import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Settings, LogOut, FileText, Clock, BookOpen, MessageCircle, Send, X, Maximize2, Minimize2, ChevronLeft, Edit, Volume2, VolumeX, LayoutDashboard, Headphones, Tv, Play, Pause, SkipBack, SkipForward, Bookmark, FileUp, ThumbsUp, ThumbsDown, Share2, Flag, MoreVertical, MessageSquare, Home, Users, Wand2 } from 'lucide-react';
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

interface Note {
  id: string;
  content: string;
  timestamp: number;
  user_id: string;
  course_name: string;
  created_at: string;
  updated_at: string;
}

const PublishedAvatarPresentation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isPdfVisible, setIsPdfVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isVolumeControlVisible, setIsVolumeControlVisible] = useState(false);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/signin', { replace: true });
          return;
        }

        // Validate required state data
        if (!location.state?.courseName || !location.state?.video) {
          toast.error('Invalid course data');
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

  useEffect(() => {
    // Initialize HeyGen streaming embed script
    const script = document.createElement('script');
    script.textContent = `!function(window){const host="https://labs.heygen.com",url=host+"/guest/streaming-embed?share=eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJCcnlhbl9JVF9TaXR0aW5nX3B1YmxpYyIs%0D%0AInByZXZpZXdJbWciOiJodHRwczovL2ZpbGVzMi5oZXlnZW4uYWkvYXZhdGFyL3YzLzMzYzlhYzRh%0D%0AZWFkNDRkZmM4YmMwMDgyYTM1MDYyYTcwXzQ1NTgwL3ByZXZpZXdfdGFsa18zLndlYnAiLCJuZWVk%0D%0AUmVtb3ZlQmFja2dyb3VuZCI6ZmFsc2UsImtub3dsZWRnZUJhc2VJZCI6ImJiYzVjMjIxYzk3ZDQ3%0D%0AMmRhYjA4MDQ5MWNmODAyOTQ3IiwidXNlcm5hbWUiOiI5ZjY3MzExYjY3ODM0Yzk1YTgyYmVmNmZm%0D%0ANTEwN2UzNyJ9&inIFrame=1",clientWidth=document.body.clientWidth,wrapDiv=document.createElement("div");wrapDiv.id="heygen-streaming-embed";const container=document.createElement("div");container.id="heygen-streaming-container";const stylesheet=document.createElement("style");stylesheet.innerHTML=\`\n  #heygen-streaming-embed {\n    z-index: 40;\n    position: fixed;\n    right: 40px;\n    bottom: 120px;\n    width: 200px;\n    height: 200px;\n    border-radius: 50%;\n    border: 2px solid rgba(255, 255, 255, 0.8);\n    box-shadow: 0 0 15px rgba(147, 51, 234, 0.5),\n                0 0 30px rgba(147, 51, 234, 0.3),\n                0 0 45px rgba(147, 51, 234, 0.1);\n    transition: all linear 0.1s;\n    overflow: hidden;\n    animation: glow 2s ease-in-out infinite alternate;\n    opacity: 0;\n    visibility: hidden;\n  }\n  @keyframes glow {\n    from {\n      box-shadow: 0 0 15px rgba(147, 51, 234, 0.5),\n                  0 0 30px rgba(147, 51, 234, 0.3),\n                  0 0 45px rgba(147, 51, 234, 0.1);\n    }\n    to {\n      box-shadow: 0 0 20px rgba(236, 72, 153, 0.5),\n                  0 0 35px rgba(236, 72, 153, 0.3),\n                  0 0 50px rgba(236, 72, 153, 0.1);\n    }\n  }\n  #heygen-streaming-embed.show {\n    opacity: 1;\n    visibility: visible;\n  }\n  #heygen-streaming-embed.expand {\n    \${clientWidth<540?"height: 266px; width: 96%; right: 50%; transform: translateX(50%);":"height: 366px; width: calc(366px * 16 / 9);"}\n    border: 0;\n    border-radius: 8px;\n    box-shadow: 0 0 30px rgba(147, 51, 234, 0.3);\n    animation: none;\n  }\n  #heygen-streaming-container {\n    width: 100%;\n    height: 100%;\n  }\n  #heygen-streaming-container iframe {\n    width: 100%;\n    height: 100%;\n    border: 0;\n  }\n  \`;const iframe=document.createElement("iframe");iframe.allowFullscreen=!1,iframe.title="Streaming Embed",iframe.role="dialog",iframe.allow="microphone",iframe.src=url;let visible=!1,initial=!1;window.addEventListener("message",(e=>{e.origin===host&&e.data&&e.data.type&&"streaming-embed"===e.data.type&&("init"===e.data.action?(initial=!0,wrapDiv.classList.toggle("show",initial)):"show"===e.data.action?(visible=!0,wrapDiv.classList.toggle("expand",visible)):"hide"===e.data.action&&(visible=!1,wrapDiv.classList.toggle("expand",visible)))})),container.appendChild(iframe),wrapDiv.appendChild(stylesheet),wrapDiv.appendChild(container),document.body.appendChild(wrapDiv)}(window);`;
    document.body.appendChild(script);
    setIsAvatarLoaded(true);
    toast.success('AI Assistant is ready to help!');

    // Clean up function to remove the script and container when component unmounts
    return () => {
      const embedContainer = document.getElementById('heygen-streaming-embed');
      if (embedContainer) {
        embedContainer.remove();
      }
    };
  }, []);

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
                Loading avatar presentation...
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <div className="min-h-screen relative">
            {/* Header */}
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

                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/dashboard')}
                    className="text-gray-400 hover:text-white gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Dashboard
                  </Button>
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
                          src={`/${location.state.video}`}
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
                          <Button 
                            variant="ghost" 
                            className="text-gray-400 hover:text-white gap-2"
                            onClick={() => {
                              toast.success('Thanks for your feedback!');
                            }}
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span>Like</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="text-gray-400 hover:text-white gap-2"
                            onClick={() => {
                              toast.success('Thanks for your feedback!');
                            }}
                          >
                            <ThumbsDown className="h-4 w-4" />
                            <span>Dislike</span>
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          className="text-gray-400 hover:text-white gap-2"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success('Link copied to clipboard!');
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                          <span>Share</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="text-gray-400 hover:text-white gap-2"
                          onClick={() => {
                            toast.info('Report functionality coming soon');
                          }}
                        >
                          <Flag className="h-4 w-4" />
                          <span>Report</span>
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* PDF Viewer */}
                {isPdfVisible && location.state.files?.[0] && (
                  <div className="col-span-6 h-[calc(100vh-8rem)]">
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="w-full h-full bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50"
                    >
                      <iframe
                        src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(`http://localhost:5001/api/pdf/${location.state.courseName}/${location.state.files[0]}`)}`}
                        className="w-full h-full border-0"
                        title="PDF Document"
                      />
                    </motion.div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat and Expert Interaction Buttons */}
            <div className="fixed bottom-20 right-12 z-50">
              <div className="flex flex-row gap-4 items-center">
                {/* Existing ChatBot Component */}
                <div className="bg-gray-900 rounded-lg shadow-lg">
                  <ChatBot courseName={location.state.courseName} />
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PublishedAvatarPresentation; 