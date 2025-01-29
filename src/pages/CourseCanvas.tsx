import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Save, Search, Settings, LogOut, ChevronRight, Mic, Edit, Play, Download, FileDown, MessageCircle, Menu, Video, Plus, Trash2, Pause, Volume2, Headphones, Clock } from 'lucide-react';
import ChatBot from '@/components/ChatBot';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MenuBar } from "@/components/ui/bottom-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { defaultSections } from '@/lib/default-sections';
import { motion, AnimatePresence } from 'framer-motion';

interface CourseData {
  courseName: string;
  template: string;
  persona: string;
  files: string[];
  processedSections?: Array<{
    title: string;
    content: string;
    metadata?: {
      prerequisites: string[];
      learningGoals: string[];
      estimatedTime: string;
    };
    dialogue?: Array<{
      speaker: string;
      text: string;
      purpose: string;
    }>;
  }>;
}

interface Metadata {
  prerequisites: string[];
  learningGoals: string[];
  estimatedTime: string;
}

interface Dialogue {
  expert: string;
  learner: string;
  expertPurpose?: string;
  learnerPurpose?: string;
  expertHasChanges?: boolean;
  learnerHasChanges?: boolean;
}

interface Section {
  title: string;
  metadata?: Metadata;  // Optional for backward compatibility
  dialogues: Dialogue[];
}

interface AudioPreviewState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

const AudioPreview = ({ text, speaker }: { text: string; speaker: string }) => {
  const [state, setState] = useState<AudioPreviewState>({
    isPlaying: false,
    isLoading: false,
    error: null
  });
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Function to find the best matching voice
  const findVoice = (isFemale: boolean) => {
    console.log('Finding voice for:', isFemale ? 'Samantha' : 'Daniel');
    console.log('Available voices:', availableVoices.map(v => ({ name: v.name, lang: v.lang })));
    
    // Prioritize Samantha and Daniel voices (including Nord variants)
    const preferredVoices = availableVoices.filter(voice => {
      const voiceName = voice.name.toLowerCase();
      return isFemale 
        ? (voiceName.includes('samantha') || voiceName.includes('nord samantha'))
        : (voiceName.includes('daniel') || voiceName.includes('nord daniel'));
    });

    if (preferredVoices.length > 0) {
      console.log(`Found preferred voice: ${preferredVoices[0].name}`);
      return preferredVoices[0];
    }

    // If no specific voice found, return any English voice
    const englishVoices = availableVoices.filter(voice => voice.lang.startsWith('en'));
    if (englishVoices.length > 0) {
      console.log(`Using fallback English voice: ${englishVoices[0].name}`);
      return englishVoices[0];
    }

    // Last resort: return first available voice
    console.log(`Using first available voice: ${availableVoices[0]?.name}`);
    return availableVoices[0];
  };

  // Initialize speech synthesis
  const initializeSpeech = () => {
    if (!text) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create new utterance
    speechRef.current = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings based on speaker
    const isFemale = speaker === 'samantha';
    const selectedVoice = findVoice(isFemale);
    
    if (speechRef.current && selectedVoice) {
      speechRef.current.voice = selectedVoice;
      speechRef.current.rate = 1.0;
      speechRef.current.pitch = isFemale ? 1.1 : 0.9;
      speechRef.current.volume = 1.0;
      
      // Add event listeners
      speechRef.current.onstart = () => setState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
      speechRef.current.onend = () => setState(prev => ({ ...prev, isPlaying: false, isLoading: false }));
      speechRef.current.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          isLoading: false, 
          error: 'Failed to play audio' 
        }));
        toast.error('Failed to play audio preview');
      };
    }
  };

  useEffect(() => {
    // Function to load and set voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('Loading voices:', voices.length);
      if (voices.length > 0) {
        setAvailableVoices(voices);
        setVoicesLoaded(true);
        initializeSpeech();
      }
    };

    // Try to load voices immediately
    loadVoices();

    // Set up the event listener for when voices are loaded
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      if (speechRef.current) {
        speechRef.current.onstart = null;
        speechRef.current.onend = null;
        speechRef.current.onerror = null;
      }
    };
  }, [text, speaker]);

  const handlePreview = async () => {
    if (state.isPlaying) {
      window.speechSynthesis.cancel();
      setState(prev => ({ ...prev, isPlaying: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      if (!speechRef.current || !speechRef.current.voice) {
        initializeSpeech();
      }
      
      if (speechRef.current) {
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        window.speechSynthesis.speak(speechRef.current);
      }
    } catch (error) {
      console.error('Preview error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to generate audio', 
        isLoading: false 
      }));
      toast.error('Failed to generate audio preview');
    }
  };

  return (
    <div className="relative group">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreview}
          className={cn(
            "w-8 h-8 rounded-lg transition-all",
            "hover:bg-gray-700/50",
            state.isPlaying ? (speaker === 'samantha' ? "text-purple-400 bg-purple-500/10" : "text-emerald-400 bg-emerald-500/10") : "text-gray-400",
            state.isLoading ? "opacity-50 cursor-wait" : "opacity-100"
          )}
          disabled={state.isLoading}
        >
          {state.isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
          ) : state.isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Headphones className="h-4 w-4" />
          )}
        </Button>
      </motion.div>
      <AnimatePresence>
        {state.isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"
          />
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        whileHover={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800/90 text-xs text-gray-300 rounded-md shadow-lg backdrop-blur-sm border border-gray-700/50 whitespace-nowrap z-50"
      >
        {state.isPlaying ? 'Click to stop' : 'Preview voice'}
      </motion.div>
    </div>
  );
};

const CourseCanvas = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadedSections, setLoadedSections] = useState<Section[]>([]);
  const courseData = location.state as CourseData;
  const [sections, setSections] = useState<Section[]>([]);
  const [isIndexVisible, setIsIndexVisible] = useState(true);

  useEffect(() => {
    if (!courseData) {
      navigate('/dashboard');
      return;
    }

    // Transform API response into section format if available
    if (courseData.processedSections) {
      console.log('Raw processed sections:', courseData.processedSections);
      
      // Reset loading states
      setIsLoading(true);
      setLoadingProgress(0);
      setLoadedSections([]);

      // Process sections progressively
      courseData.processedSections.forEach((section, index) => {
        setTimeout(() => {
          console.log(`Processing section ${index + 1}: ${section.title}`);
          
          try {
            const transformedSection = {
            title: section.title,
            metadata: section.metadata || {
              prerequisites: [],
              learningGoals: [],
              estimatedTime: "N/A"
            },
            dialogues: section.dialogue ? 
              section.dialogue.reduce((acc: Dialogue[], curr, index, arr) => {
                if (curr.speaker.toLowerCase() === 'expert') {
                  const learnerResponse = arr.find((d, i) => 
                    i > arr.indexOf(curr) && d.speaker.toLowerCase() === 'learner'
                  );
                  
                  if (learnerResponse) {
                    acc.push({
                      expert: curr.text,
                      learner: learnerResponse.text,
                      expertPurpose: curr.purpose,
                      learnerPurpose: learnerResponse.purpose,
                    });
                  }
                }
                return acc;
              }, [])
              : []
          };

            setLoadedSections(prev => [...prev, transformedSection]);
            
            // Update progress
            const progress = ((index + 1) / courseData.processedSections.length) * 100;
            setLoadingProgress(progress);

            // Check if all sections are loaded
            if (index === courseData.processedSections.length - 1) {
              setTimeout(() => setIsLoading(false), 500);
            }

        } catch (error) {
            console.error(`Failed to parse section ${index + 1}:`, error);
            const basicSection = {
            title: section.title,
            metadata: {
              prerequisites: [],
              learningGoals: [],
              estimatedTime: "N/A"
            },
            dialogues: []
          };
            setLoadedSections(prev => [...prev, basicSection]);
          }
        }, index * 300); // Add a small delay between each section load
      });
    }
  }, [courseData, navigate]);

  // Update main sections state when loadedSections changes
  useEffect(() => {
    setSections(loadedSections);
  }, [loadedSections]);

  const handleTextEdit = (sectionIndex: number, dialogueIndex: number, role: 'expert' | 'learner', newText: string) => {
    setLoadedSections(prevSections => {
      const newSections = [...prevSections];
      const dialogue = { ...newSections[sectionIndex].dialogues[dialogueIndex] };
      dialogue[role] = newText;
      dialogue[`${role}HasChanges`] = true;
      newSections[sectionIndex].dialogues[dialogueIndex] = dialogue;
      return newSections;
    });
  };

  const handleSaveChanges = (sectionIndex: number, dialogueIndex: number, role: 'expert' | 'learner') => {
    setLoadedSections(prevSections => {
      const newSections = [...prevSections];
      const dialogue = { ...newSections[sectionIndex].dialogues[dialogueIndex] };
      dialogue[`${role}HasChanges`] = false;
      newSections[sectionIndex].dialogues[dialogueIndex] = dialogue;
      return newSections;
    });
  };

  const handleDiscardChanges = (sectionIndex: number, dialogueIndex: number, role: 'expert' | 'learner') => {
    setLoadedSections(prevSections => {
      const newSections = [...prevSections];
      const dialogue = { ...newSections[sectionIndex].dialogues[dialogueIndex] };
      dialogue[`${role}HasChanges`] = false;
      newSections[sectionIndex].dialogues[dialogueIndex] = dialogue;
      return newSections;
    });
  };

  const handleTransformToAudio = () => {
    const courseState = {
      courseName: courseData?.courseName,
      sections: loadedSections.map(section => ({
        title: section.title,
        dialogues: section.dialogues.map(dialogue => ({
          expert: dialogue.expert,
          learner: dialogue.learner
        }))
      }))
    };
    
    console.log('Navigating to /index with state:', courseState);
    
    // Use replace instead of navigate to prevent history manipulation
    navigate('/index', {
      replace: true,
      state: courseState
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const scrollToSection = (sectionId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleAddDialogue = (sectionIndex: number) => {
    setLoadedSections(prevSections => {
      const newSections = [...prevSections];
      newSections[sectionIndex].dialogues.push({
        expert: '',
        learner: '',
        expertHasChanges: true,
        learnerHasChanges: true
      });
      return newSections;
    });
  };

  const handleDeleteDialogue = (sectionIndex: number, dialogueIndex: number) => {
    setLoadedSections(prevSections => {
      const newSections = [...prevSections];
      newSections[sectionIndex].dialogues = newSections[sectionIndex].dialogues.filter((_, index) => index !== dialogueIndex);
      return newSections;
    });
  };

  const menuItems = [
    {
      icon: (props) => <ChevronLeft {...props} />,
      label: "Back to Dashboard",
      onClick: () => navigate('/dashboard')
    },
    {
      icon: (props) => <Menu {...props} />,
      label: "Toggle Index",
      onClick: () => setIsIndexVisible(!isIndexVisible)
    },
    {
      icon: (props) => <Save {...props} />,
      label: "Save Canvas",
      onClick: () => console.log('Save course')
    },
    {
      icon: (props) => <FileDown {...props} />,
      label: "Download PDF",
      onClick: () => console.log('Download as PDF')
    },
    {
      icon: (props) => <Mic {...props} />,
      label: "Transform to Audio",
      onClick: handleTransformToAudio
    },
    {
      icon: (props) => <Video {...props} />,
      label: "Transform to Video",
      onClick: () => toast.info("Video course transformation coming soon!", {
        description: "We're working on bringing you interactive video courses. Stay tuned!",
        duration: 3000
      })
    }
  ];

  const SectionMetadata = ({ metadata }: { metadata?: Metadata }) => {
    if (!metadata) return null;
    
    return (
      <div className="mb-6 p-4 bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-purple-400 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Prerequisites
            </h3>
            <ul className="list-none space-y-1.5">
              {metadata.prerequisites.map((prereq, index) => (
                <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-500 mt-2 flex-shrink-0" />
                  {prereq}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-emerald-400 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Learning Goals
            </h3>
            <ul className="list-none space-y-1.5">
              {metadata.learningGoals.map((goal, index) => (
                <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-500 mt-2 flex-shrink-0" />
                  {goal}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-blue-400 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Estimated Time
            </h3>
            <div className="text-sm text-gray-300 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              {metadata.estimatedTime}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DialoguePurpose = ({ purpose }: { purpose?: string }) => {
    if (!purpose) return null;

    const getPurposeStyle = (purpose: string) => {
      const styles: Record<string, string> = {
        introduction: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
        question: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
        explanation: 'bg-green-400/10 text-green-400 border-green-400/20',
        understanding: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
        analogy: 'bg-pink-400/10 text-pink-400 border-pink-400/20',
        clarification: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
        summary: 'bg-teal-400/10 text-teal-400 border-teal-400/20',
        motivation: 'bg-red-400/10 text-red-400 border-red-400/20',
        quiz: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
        guidance: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
        planning: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
        reflection: 'bg-violet-400/10 text-violet-400 border-violet-400/20',
        reinforcement: 'bg-lime-400/10 text-lime-400 border-lime-400/20',
        encouragement: 'bg-rose-400/10 text-rose-400 border-rose-400/20',
        career: 'bg-fuchsia-400/10 text-fuchsia-400 border-fuchsia-400/20',
        curiosity: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
        advice: 'bg-sky-400/10 text-sky-400 border-sky-400/20'
      };
      return styles[purpose.toLowerCase()] || 'bg-gray-400/10 text-gray-400 border-gray-400/20';
    };

    return (
      <motion.span
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "text-xs px-3 py-1 rounded-full border capitalize transition-all duration-200",
          "hover:shadow-lg hover:border-opacity-50",
          "flex items-center gap-1.5",
          getPurposeStyle(purpose)
        )}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
        {purpose.toLowerCase()}
      </motion.span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="px-8 py-4 flex justify-between items-center">
          {/* Logo */}
          <div 
            onClick={() => navigate('/dashboard')} 
            className="cursor-pointer"
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              AI-Buddy
            </h1>
          </div>

          {/* Search and Profile Section */}
          <div className="flex items-center space-x-6">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search courses..."
                className="pl-10 bg-gray-800/50 border-gray-700 text-white w-full"
              />
            </div>
            
            <span className="text-gray-300">Welcome Vijay</span>
            
            {/* Profile Dropdown */}
            <div className="relative group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer">
                <span className="text-white font-medium">V</span>
              </div>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 py-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
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
      </header>

      {isLoading && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md flex items-center justify-center z-50">
          <div className="text-center space-y-6 max-w-md w-full mx-auto px-4">
            <div className="relative">
              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden shadow-lg">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <div className="absolute -bottom-6 left-0 right-0 text-center">
                <span className="text-sm text-gray-400 font-medium">{Math.round(loadingProgress)}%</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                </div>
              </div>
              <p className="text-xl text-white font-medium bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Creating your course canvas
              </p>
              <p className="text-sm text-gray-400">
                {loadedSections.length > 0 
                  ? `Loaded ${loadedSections.length} of ${courseData?.processedSections?.length} sections`
                  : 'Preparing sections...'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Left Side Index */}
        <div className={cn(
          "w-64 bg-gray-800/50 border-r border-gray-700 h-[calc(100vh-5rem)] sticky top-[4rem] overflow-y-auto p-4",
          "transition-all duration-300",
          isIndexVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full w-0"
        )}>
          <h3 className="text-lg font-semibold text-white mb-4">Course Sections</h3>
          <nav className="space-y-2">
            {loadedSections.map((section, index) => (
              <a
                key={index}
                href={`#section-${index}`}
                onClick={scrollToSection(`section-${index}`)}
                className="block px-4 py-3 text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors relative group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                    {index + 1}
                  </div>
                  <span className="text-sm">{section.title}</span>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </a>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-[calc(100vh-5rem)]">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white">Course Canvas</h1>
                <p className="text-gray-400 mt-1">{courseData?.courseName}</p>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={handleTransformToAudio}
                  className="bg-purple-600 hover:bg-purple-700 text-white min-w-[200px] relative group overflow-visible"
                >
                  {/* Outer glow effect */}
                  <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 opacity-75 blur-md group-hover:opacity-100 transition-opacity animate-magic-pulse" />
                  {/* Button content */}
                  <div className="relative flex items-center justify-center bg-purple-600 rounded-md px-4 py-2">
                    <Mic className="h-4 w-4 mr-2" />
                    Transform to Audio Course
                  </div>
                </Button>
                <Button
                  onClick={() => toast.info("Video course transformation coming soon!", {
                    description: "We're working on bringing you interactive video courses. Stay tuned!",
                    duration: 3000
                  })}
                  className="bg-transparent border border-gray-700 text-gray-400 hover:text-gray-300 hover:border-gray-600 transition-all duration-200"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Transform to Video Course
                </Button>
              </div>
            </div>
            
            <div className="space-y-8">
              {loadedSections.map((section, sectionIndex) => (
                <Card key={sectionIndex} id={`section-${sectionIndex}`} 
                  className="bg-gray-800/40 border-gray-700/50 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-300 group">
                  <CardContent className="p-6 space-y-6">
                    {/* Section Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-sm font-medium text-white shadow-lg">
                        {sectionIndex + 1}
                      </div>
                      <h2 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors">{section.title}</h2>
                    </div>
                    
                    {/* Section Metadata */}
                    <SectionMetadata metadata={section.metadata} />
                    
                    {section.dialogues.map((dialogue, dialogueIndex) => (
                      <div key={dialogueIndex} className="space-y-4 relative group">
                        {/* Expert's (Samantha's) Dialogue */}
                        <div className="flex gap-4 items-start group relative">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/5 overflow-hidden">
                              <img 
                                src="/images/samantha-avatar.png" 
                                alt="Samantha"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://api.dicebear.com/7.x/personas/svg?seed=samantha&backgroundColor=transparent&backgroundType=gradientLinear&backgroundRotation=360&hair=long&hairProbability=100&face=smile&mouth=smile&eyes=round&eyebrows=up&skinColor=f2d3b1`;
                                }}
                              />
                            </div>
                            <span className="text-xs text-purple-400 font-medium">Samantha</span>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                              <DialoguePurpose purpose={dialogue.expertPurpose} />
                              <AudioPreview text={dialogue.expert} speaker="samantha" />
                            </div>
                            <div className="relative group/textarea">
                              <motion.div
                                initial={{ opacity: 0.9 }}
                                whileFocus={{ opacity: 1 }}
                                className="relative"
                              >
                                <Textarea
                                  value={dialogue.expert}
                                  onChange={(e) => handleTextEdit(sectionIndex, dialogueIndex, 'expert', e.target.value)}
                                  className={cn(
                                    "min-h-[60px] bg-gray-700/30 border-gray-600/50",
                                    "hover:border-purple-500/50 focus:border-purple-500",
                                    "text-white resize-none p-4 rounded-2xl rounded-tl-sm",
                                    "transition-all duration-200",
                                    "placeholder-gray-400",
                                    "focus:ring-2 focus:ring-purple-500/20 focus:bg-gray-700/50",
                                    "shadow-sm hover:shadow-md focus:shadow-lg",
                                    "backdrop-blur-sm"
                                  )}
                                  placeholder="Enter expert's dialogue..."
                                />
                              </motion.div>
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute top-2 right-2 flex gap-2"
                              >
                                {dialogue.expertHasChanges && (
                                  <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDiscardChanges(sectionIndex, dialogueIndex, 'expert')}
                                      className="h-8 text-gray-400 hover:text-white hover:bg-gray-800/80 backdrop-blur-sm"
                                    >
                                      Discard
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveChanges(sectionIndex, dialogueIndex, 'expert')}
                                      className="h-8 bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                                    >
                                      Save
                                    </Button>
                                  </div>
                                )}
                              </motion.div>
                            </div>
                          </div>
                        </div>

                        {/* Learner's (Daniel's) Dialogue */}
                        <div className="flex gap-4 items-start justify-end group relative">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-end gap-2 mb-2">
                              <AudioPreview text={dialogue.learner} speaker="daniel" />
                              <DialoguePurpose purpose={dialogue.learnerPurpose} />
                            </div>
                            <div className="relative">
                              <Textarea
                                value={dialogue.learner}
                                onChange={(e) => handleTextEdit(sectionIndex, dialogueIndex, 'learner', e.target.value)}
                                className="min-h-[60px] bg-gray-700/50 border-gray-600 hover:border-emerald-500/50 focus:border-emerald-500 text-white resize-none p-4 rounded-2xl rounded-tr-sm transition-colors"
                              />
                              <div className="absolute -left-10 top-1/2 -translate-y-1/2 group/delete">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteDialogue(sectionIndex, dialogueIndex)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10 w-8 h-8 rounded-lg transform hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                                <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded opacity-0 group-hover/delete:opacity-100 transition-opacity whitespace-nowrap">
                                  Warning: This will delete the conversation pair
                                </div>
                              </div>
                              {dialogue.learnerHasChanges && (
                                <div className="absolute top-2 right-2 flex gap-2 animate-in fade-in slide-in-from-top-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDiscardChanges(sectionIndex, dialogueIndex, 'learner')}
                                    className="h-8 text-gray-400 hover:text-white hover:bg-gray-800"
                                  >
                                    Discard
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveChanges(sectionIndex, dialogueIndex, 'learner')}
                                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    Save
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/5 overflow-hidden">
                              <img 
                                src="/images/daniel-avatar.png" 
                                alt="Daniel"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://api.dicebear.com/7.x/personas/svg?seed=daniel&backgroundColor=transparent&backgroundType=gradientLinear&backgroundRotation=360&hair=short&hairProbability=100&face=smile&mouth=smile&eyes=round&eyebrows=up&skinColor=eac393`;
                                }}
                              />
                            </div>
                            <span className="text-xs text-emerald-400 font-medium">Daniel</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add Dialogue Button */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex justify-center pt-4 border-t border-gray-700/50"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAddDialogue(sectionIndex)}
                        className={cn(
                          "text-gray-400 hover:text-white",
                          "bg-gradient-to-r from-purple-500/5 to-pink-500/5",
                          "hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20",
                          "w-8 h-8 rounded-lg",
                          "transition-all duration-300",
                          "shadow-lg hover:shadow-purple-500/10"
                        )}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm z-40">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">© 2025 AI-Buddy. All rights reserved.</span>
              <span className="text-gray-600">•</span>
              <span className="text-sm text-gray-400">Version 2.0.0</span>
            </div>
            <p className="text-sm text-gray-400">Created by Vijay Betigiri (vijay.betigiri@swisscom.com)</p>
          </div>
        </div>
      </footer>

      {/* Add some bottom padding to the main content to prevent overlap with fixed footer */}
      <div className="pb-20" />

      <ChatBot />

      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
        <MenuBar 
          items={menuItems} 
          className="shadow-xl" 
        />
      </div>
    </div>
  );
};

export default CourseCanvas; 