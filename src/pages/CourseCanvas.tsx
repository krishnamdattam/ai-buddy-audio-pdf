import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Save, Search, Settings, LogOut, ChevronRight, Mic, Edit, Play, Download, FileDown, MessageCircle, Menu, Video, Plus, Trash2, Pause, Volume2, Headphones, Clock, LayoutDashboard } from 'lucide-react';
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
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

interface AudioFile {
  sectionTitle: string;
  fileName: string;
  speakerRole: 'expert' | 'learner';
}

interface CourseData {
  name: string;
  courseName?: string;  // Added for backward compatibility
  template: string;
  persona: string;
  files: string[];
  audioFiles?: AudioFile[];
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
    dialogues?: Array<{
      speaker: string;
      text: string;
      purpose: string;
    }>;
    conversation?: {
      dialogue?: Array<{
        speaker: string;
        text: string;
        purpose: string;
      }>;
      dialogues?: Array<{
        speaker: string;
        text: string;
        purpose: string;
      }>;
    };
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
  metadata: {
    prerequisites: string[];
    learningGoals: string[];
    estimatedTime: string;
  };
  dialogues: Dialogue[];
  subtitle?: string;
  description?: string;
  audioFile?: string;
  pdfPage?: number;
  duration?: string;
}

interface AudioPreviewState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

const AudioPreview = ({ text, speaker, disabled = false }: { text: string; speaker: string; disabled?: boolean }) => {
  const [state, setState] = useState<AudioPreviewState>({
    isPlaying: false,
    isLoading: false,
    error: null
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePreview = async () => {
    if (disabled) {
      toast.error('Audio is not available for this course yet');
      return;
    }

    if (state.isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setState(prev => ({ ...prev, isPlaying: false }));
      return;
    }

    if (!text.trim()) {
      toast.error('No text to preview');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Call backend TTS service
      const response = await fetch('http://localhost:5001/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          speaker: speaker.toLowerCase()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      // Get audio blob from response
      const audioBlob = await response.blob();
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio data');
      }

      const audioUrl = URL.createObjectURL(audioBlob);

      // Create or update audio element
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => {
          setState(prev => ({ ...prev, isPlaying: false }));
          URL.revokeObjectURL(audioUrl);
        };
        audioRef.current.onerror = (e) => {
          console.error('Audio playback error:', e);
        setState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          isLoading: false, 
          error: 'Failed to play audio' 
        }));
          URL.revokeObjectURL(audioUrl);
        toast.error('Failed to play audio preview');
      };
      } else {
        const oldSrc = audioRef.current.src;
        audioRef.current.src = audioUrl;
        URL.revokeObjectURL(oldSrc);
      }

      await audioRef.current.play();
      setState(prev => ({ ...prev, isPlaying: true, isLoading: false }));

    } catch (error) {
      console.error('Preview error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to generate audio', 
        isLoading: false 
      }));
      toast.error(error instanceof Error ? error.message : 'Failed to generate audio preview');
    }
  };

  return (
    <div className="relative group">
      <motion.div
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreview}
          className={cn(
            "w-8 h-8 rounded-lg transition-all",
            "hover:bg-gray-700/50",
            state.isPlaying ? (speaker === 'samantha' ? "text-purple-400 bg-purple-500/10" : "text-emerald-400 bg-emerald-500/10") : "text-gray-400",
            state.isLoading ? "opacity-50 cursor-wait" : "opacity-100",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled || state.isLoading}
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
        {disabled ? 'Audio not available' : state.isPlaying ? 'Click to stop' : 'Preview voice'}
      </motion.div>
    </div>
  );
};

const ScrollProgressBar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-[4rem] left-0 right-0 h-1 bg-gray-800 z-50">
      <div
        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
};

const DialoguePurpose = ({ purpose }: { purpose?: string }) => {
  if (!purpose) return null;

  const getPurposeStyle = (purpose: string) => {
    const styles: Record<string, string> = {
      introduction: 'text-blue-400',
      question: 'text-yellow-400',
      explanation: 'text-green-400',
      understanding: 'text-purple-400',
      analogy: 'text-pink-400',
      clarification: 'text-orange-400',
      summary: 'text-teal-400',
      motivation: 'text-red-400',
      quiz: 'text-indigo-400',
      guidance: 'text-amber-400',
      planning: 'text-cyan-400',
      reflection: 'text-violet-400',
      reinforcement: 'text-lime-400',
      encouragement: 'text-rose-400',
      career: 'text-fuchsia-400',
      curiosity: 'text-amber-400',
      advice: 'text-sky-400'
    };
    return styles[purpose.toLowerCase()] || 'text-gray-400';
  };

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "text-xs font-medium transition-all duration-200",
        "hover:opacity-80 cursor-default",
        "flex items-center gap-1.5",
        getPurposeStyle(purpose)
      )}
    >
      #
      <span>{purpose.toLowerCase().replace(/\s+/g, '_')}</span>
    </motion.span>
  );
};

const CourseCanvas = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadedSections, setLoadedSections] = useState<Section[]>([]);
  const [courseData, setCourseData] = useState<CourseData | null>(location.state as CourseData);
  const [sections, setSections] = useState<Section[]>([]);
  const [isIndexVisible, setIsIndexVisible] = useState(true);
  const [courseFileName, setCourseFileName] = useState<string>('');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [expertVoice, setExpertVoice] = useState(location.state?.expertVoice || 'en-US-JennyNeural');
  const [learnerVoice, setLearnerVoice] = useState(location.state?.learnerVoice || 'en-US-TonyNeural');
  const [isAudioAvailable, setIsAudioAvailable] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    // Add debug logging
    console.log('CourseCanvas mounted with state:', location.state);

    const loadSections = async () => {
      try {
        // Get course name from state
        const locationState = location.state as CourseData;
        if (!locationState) {
          throw new Error('No course data provided');
        }
        
        // Use courseName from state if available, otherwise use name
        const courseName = locationState.courseName || locationState.name;
        if (!courseName) {
          throw new Error('No course name provided');
        }
        
        console.log('Loading course:', courseName);
        setCourseFileName(courseName);

        // First fetch the courses list to check audio availability
        const coursesResponse = await fetch('http://localhost:5001/api/courses');
        if (!coursesResponse.ok) {
          throw new Error('Failed to fetch courses list');
        }
        const coursesList = await coursesResponse.json();
        const currentCourse = coursesList.find((c: any) => c.name === courseName || c.title === courseName);
        setIsAudioAvailable(currentCourse?.audioAvailable || false);

        // Always fetch from backend first
        try {
          console.log('Fetching course data from backend');
          const response = await fetch(`http://localhost:5001/api/courses/${courseName}`);
          
          if (!response.ok) {
            throw new Error(`Failed to load course data: ${response.statusText}`);
          }
          
          const courseDataFromBackend = await response.json();
          console.log('Loaded course data from backend:', courseDataFromBackend);
          
          if (!courseDataFromBackend || !courseDataFromBackend.processedSections) {
            throw new Error('Invalid course data structure from backend');
          }
          
          // Set the course data
          setCourseData(courseDataFromBackend);
          
          // Transform the sections
          console.log('Raw sections data:', courseDataFromBackend.processedSections);
          const transformedSections = transformSections(courseDataFromBackend.processedSections);
          console.log('Final transformed sections:', {
            sectionsCount: transformedSections.length,
            dialoguesPerSection: transformedSections.map(section => ({
              title: section.title,
              dialoguesCount: section.dialogues.length,
              dialogues: section.dialogues
            }))
          });
          
          setSections(transformedSections);
          setLoadedSections(transformedSections);
          
        } catch (error) {
          console.error('Error loading course from backend:', error);
          // If backend fetch fails, use state data as fallback
          if (locationState.processedSections && locationState.processedSections.length > 0) {
            console.log('Using course data from location state as fallback:', locationState);
            setCourseData(locationState);
            const transformedSections = transformSections(locationState.processedSections);
            setSections(transformedSections);
            setLoadedSections(transformedSections);
          } else {
            throw new Error('No valid course data available');
          }
        }
        
        setIsLoading(false);

      } catch (error) {
        console.error('Error loading sections:', error);
        toast.error('Failed to load course sections: ' + (error instanceof Error ? error.message : 'Unknown error'));
        setIsLoading(false);
      }
    };

    loadSections();
  }, [location.state, navigate]);

  const transformSections = (processedSections: any[]): Section[] => {
    if (!Array.isArray(processedSections)) {
      console.error('processedSections is not an array:', processedSections);
      return [];
    }

    return processedSections.map(section => {
      if (!section) {
        console.error('Invalid section:', section);
        return {
          title: 'Unknown Section',
          metadata: {
            prerequisites: [],
            learningGoals: [],
            estimatedTime: '0 minutes'
          },
          dialogues: []
        };
      }

      console.log('Processing section:', section.title);
      console.log('Section data:', section);
      
      // Extract dialogues from the section, checking all possible properties
      const rawDialogues = section.dialogue || section.dialogues || 
        (section.conversation?.dialogue || section.conversation?.dialogues) || [];
      console.log(`Found ${rawDialogues.length} dialogues in section "${section.title}"`, rawDialogues);
      
      const transformedDialogues: Dialogue[] = [];
      let currentPair: { expert?: any; learner?: any } = {};

      // Process each dialogue entry
      rawDialogues.forEach((entry: any, index: number) => {
        if (!entry || !entry.speaker || !entry.text) {
          console.error('Invalid dialogue entry:', entry);
          return;
        }

        const role = entry.speaker.toLowerCase();
        console.log(`Processing dialogue ${index + 1}, speaker: ${role}, text: "${entry.text.substring(0, 50)}..."`);
        
        if (role === 'expert') {
          // If we have a complete pair, save it and start a new one
          if (currentPair.expert && currentPair.learner) {
            transformedDialogues.push({
              expert: currentPair.expert.text,
              learner: currentPair.learner.text,
              expertPurpose: currentPair.expert.purpose,
              learnerPurpose: currentPair.learner.purpose,
              expertHasChanges: false,
              learnerHasChanges: false
            });
            currentPair = {};
          }
          currentPair.expert = entry;
        } else if (role === 'learner') {
          currentPair.learner = entry;
          
          // If we have both expert and learner, save the pair
          if (currentPair.expert) {
            transformedDialogues.push({
              expert: currentPair.expert.text,
              learner: currentPair.learner.text,
              expertPurpose: currentPair.expert.purpose,
              learnerPurpose: currentPair.learner.purpose,
              expertHasChanges: false,
              learnerHasChanges: false
            });
            currentPair = {};
          }
        }
      });

      // Handle any remaining complete pair
      if (currentPair.expert && currentPair.learner) {
        transformedDialogues.push({
          expert: currentPair.expert.text,
          learner: currentPair.learner.text,
          expertPurpose: currentPair.expert.purpose,
          learnerPurpose: currentPair.learner.purpose,
          expertHasChanges: false,
          learnerHasChanges: false
        });
      }

      console.log(`Transformed ${transformedDialogues.length} dialogue pairs for section "${section.title}"`, transformedDialogues);

      return {
        title: section.title || 'Untitled Section',
        metadata: section.metadata || {
          prerequisites: [],
          learningGoals: [],
          estimatedTime: '0 minutes'
        },
        dialogues: transformedDialogues
      };
    });
  };

  // Function to save course changes
  const saveCourseChanges = async (updatedSections: Section[]) => {
    try {
      const response = await fetch('http://localhost:5001/save-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseName: courseFileName,
          data: {
            ...courseData,
            processedSections: updatedSections.map(section => ({
              title: section.title,
              metadata: section.metadata,
              dialogue: section.dialogues.flatMap(dialogue => [
                {
                  speaker: 'Expert',
                  text: dialogue.expert,
                  purpose: dialogue.expertPurpose
                },
                {
                  speaker: 'Learner',
                  text: dialogue.learner,
                  purpose: dialogue.learnerPurpose
                }
              ])
            }))
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save course changes');
      }

      toast.success("Course changes saved successfully", {
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to save course changes:', error);
      toast.error("Failed to save course changes", {
        duration: 3000
      });
    }
  };

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

  const handleSaveChanges = async (sectionIndex: number, dialogueIndex: number, role: 'expert' | 'learner') => {
    setLoadedSections(prevSections => {
      const newSections = [...prevSections];
      const dialogue = { ...newSections[sectionIndex].dialogues[dialogueIndex] };
      dialogue[`${role}HasChanges`] = false;
      newSections[sectionIndex].dialogues[dialogueIndex] = dialogue;
      
      // Save all changes to the JSON file
      saveCourseChanges(newSections);
      
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

  // Add function to save audio to server
  const saveAudioToServer = async (audioBlob: Blob, filename: string) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('filename', filename);

    try {
      const response = await fetch('http://localhost:5001/api/save-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save audio file');
      }

      const data = await response.json();
      return data.filepath;
    } catch (error) {
      console.error('Error saving audio file:', error);
      throw error;
    }
  };

  // Function to concatenate audio buffers with a small pause between them
  const concatenateAudioBuffers = (buffers: ArrayBuffer[]): ArrayBuffer | null => {
    // Validate input buffers
    if (!buffers || buffers.length === 0 || buffers.some(buffer => !buffer)) {
      console.error('Invalid audio buffers received:', buffers);
      return null;
    }

    try {
      // Calculate total length including 0.5s silence between each buffer
      const sampleRate = 16000; // 16kHz
      const pauseSamples = Math.floor(0.5 * sampleRate); // 0.5 seconds of silence
      const pauseBuffer = new ArrayBuffer(pauseSamples * 2); // 2 bytes per sample for 16-bit
      new Int16Array(pauseBuffer).fill(0); // Fill with silence

      let totalLength = buffers.reduce((acc, buffer) => acc + buffer.byteLength, 0);
      totalLength += (buffers.length - 1) * pauseBuffer.byteLength; // Add pauses between segments

      const result = new Uint8Array(totalLength);
      let offset = 0;

      buffers.forEach((buffer, index) => {
        result.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;

        // Add pause after each segment except the last one
        if (index < buffers.length - 1) {
          result.set(new Uint8Array(pauseBuffer), offset);
          offset += pauseBuffer.byteLength;
        }
      });

      return result.buffer;
    } catch (error) {
      console.error('Error concatenating audio buffers:', error);
      return null;
    }
  };

  // Update the handleTransformToAudio function
  const handleTransformToAudio = async () => {
    if (!courseData || !courseData.processedSections) {
      console.log('Current courseData:', courseData);
      toast.error('Invalid course data', {
        description: 'Course data is missing or invalid',
        duration: 3000
      });
      return;
    }

    // Get the course name, with fallbacks
    const courseName = courseFileName || courseData.name || courseData.courseName;
    if (!courseName) {
      toast.error('Course name is missing', {
        description: 'Could not determine the course name',
        duration: 3000
      });
      return;
    }

    // Check if audio is already available for this course
    if (isAudioAvailable) {
      toast.info('Audio course already exists', {
        description: 'Loading audio course...',
        duration: 3000
      });

      // Fetch the course data to get the audio files
      try {
        const response = await fetch(`http://localhost:5001/api/courses/${courseName}`);
        if (!response.ok) {
          throw new Error('Failed to fetch course data');
        }
        const courseDataWithAudio = await response.json();

        // Navigate to index page with the existing course data
        navigate('/index', {
          state: { 
            courseName: courseName,
            sections: courseData.processedSections,
            audioFiles: courseDataWithAudio.audioFiles || [],
            files: courseData.files
          },
          replace: true
        });
        return;
      } catch (error) {
        console.error('Error fetching course data:', error);
        toast.error('Failed to load audio course');
        return;
      }
    }

    setIsGeneratingAudio(true);
    setAudioProgress(0);

    try {
      // Transform sections to ensure dialogues are in the correct format
      const processedSections = loadedSections.map(section => ({
        title: section.title,
        metadata: section.metadata,
        dialogue: section.dialogues.flatMap(dialogue => [
          {
            speaker: 'Expert',
            text: dialogue.expert,
            purpose: dialogue.expertPurpose
          },
          {
            speaker: 'Learner',
            text: dialogue.learner,
            purpose: dialogue.learnerPurpose
          }
        ])
      }));

      // Call the backend API to generate audio course
      const response = await fetch('http://localhost:5001/api/generate-audio-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseName: courseName,
          processedSections: processedSections
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate audio course');
      }

      if (result.success) {
        const audioFiles = result.course?.audioFiles || [];
        
        toast.success(`Course "${courseName}" is ready!`, {
          description: `Generated ${audioFiles.length} audio files`,
          duration: 3000
        });

        // Update local state
        setCourseData(prevCourse => ({
          ...prevCourse,
          audioFiles: audioFiles,
          audioAvailable: true
        }));

        // Navigate to index page with the course data
        navigate('/index', {
          state: { 
            courseName: courseName,
            sections: courseData.processedSections,
            audioFiles: audioFiles,
            files: courseData.files
          },
          replace: true
        });
      } else {
        throw new Error(result.error || 'Failed to generate audio course');
      }

    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error('Failed to generate audio', {
        description: error instanceof Error ? error.message : 'An error occurred',
        duration: 3000
      });
    } finally {
      setIsGeneratingAudio(false);
      setAudioProgress(0);
    }
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
      icon: (props) => <LayoutDashboard {...props} />,
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
      icon: (props) => (
        <div className="relative">
          {/* Glowing background effect */}
          <div className="absolute -inset-1 bg-purple-500 rounded-full opacity-75 group-hover:opacity-100 blur animate-pulse" />
          <Mic {...props} className="relative z-10 text-white" />
        </div>
      ),
      label: "Transform to Audio",
      onClick: handleTransformToAudio,
      className: "relative group hover:scale-110 transition-transform"
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

  // Add this effect to check audio availability when the course loads
  useEffect(() => {
    const checkAudioAvailability = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/courses');
        const courses = await response.json();
        const currentCourse = courses.find(c => c.name === courseFileName);
        if (currentCourse) {
          setIsAudioAvailable(currentCourse.audioAvailable);
        }
      } catch (error) {
        console.error('Error checking audio availability:', error);
        setIsAudioAvailable(false);
      }
    };

    if (courseFileName) {
      checkAudioAvailability();
    }
  }, [courseFileName]);

  // Update the PDF viewer URL construction
  const pdfViewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(`file://${pdfUrl}`)}`;

  // Add debug rendering
  if (!courseData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">No course data available</div>
      </div>
    );
  }

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
      <ScrollProgressBar />

      {(isLoading || isGeneratingAudio) && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md flex items-center justify-center z-50">
          <div className="text-center space-y-6 max-w-md w-full mx-auto px-4">
            <div className="relative">
              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden shadow-lg">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition-all duration-300 ease-out"
                  style={{ width: `${isGeneratingAudio ? audioProgress : loadingProgress}%` }}
                />
              </div>
              <div className="absolute -bottom-6 left-0 right-0 text-center">
                <span className="text-sm text-gray-400 font-medium">
                  {isGeneratingAudio ? `${Math.round(audioProgress)}%` : `${Math.round(loadingProgress)}%`}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-xl text-white font-medium bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {isGeneratingAudio ? 'Generating audio files' : 'Creating your course canvas'}
              </h2>
              <p className="text-sm text-gray-400">
                {isGeneratingAudio 
                  ? 'Converting conversations to speech...'
                  : loadedSections.length > 0 
                    ? `Loaded ${loadedSections.length} of ${courseData?.processedSections?.length} sections`
                    : 'Preparing sections...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
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
              <h2 className="text-xl text-white font-medium bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Creating your course canvas
              </h2>
              <p className="text-sm text-gray-400">
                {loadedSections.length > 0 
                  ? `Loaded ${loadedSections.length} of ${courseData?.processedSections?.length} sections`
                  : 'Preparing sections...'}
              </p>
            </div>
          </div>
        </div>
      ) : (
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
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium">
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
                  <p className="text-gray-400 mt-1">{courseData?.name}</p>
                </div>
                <div className="flex gap-4">
                  {/* Remove the transform buttons from here */}
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
                        <h2 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors">
                          {section.title}
                        </h2>
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
                                <AudioPreview 
                                  text={dialogue.expert} 
                                  speaker="samantha" 
                                  disabled={!isAudioAvailable} 
                                />
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
                                <AudioPreview 
                                  text={dialogue.learner} 
                                  speaker="daniel" 
                                  disabled={!isAudioAvailable} 
                                />
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
      )}

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