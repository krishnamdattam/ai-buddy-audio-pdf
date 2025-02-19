import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, ChevronRight, BookOpen, Clock, Settings, LogOut, Search, Plus, Users, FileText, Upload, Play, MessageCircle, X, Headphones, Presentation, Languages, MessageSquare, Trophy, Star, Coins, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import ChatBot from '@/components/ChatBot';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { APIResponseValidator, type APIResponse } from '@/lib/validators';
import { defaultSections } from '@/lib/default-sections';
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import AnimatedLoadingSkeleton from "@/components/ui/animated-loading-skeleton";
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Add shimmer animation
const shimmerAnimation = {
  '@keyframes shimmer': {
    '0%': {
      transform: 'translateX(-100%)',
    },
    '100%': {
      transform: 'translateX(100%)',
    },
  },
  '.animate-shimmer': {
    animation: 'shimmer 2s infinite',
  },
};

// Add the animation to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    .animate-shimmer {
      animation: shimmer 2s infinite;
    }
  `;
  document.head.appendChild(style);
}

// First, create an interface for the template structure
interface CourseTemplate {
  id: string;
  title: string;
  description: string;
  duration: string;
}

// Update the interface for audio files
interface AudioFile {
  sectionTitle: string;
  fileName: string;
  speakerRole: 'expert' | 'learner';
}

// Update the type definitions to match the actual data structure
interface ProcessedSection {
  title?: string;
  content?: string;
  metadata?: {
    prerequisites?: string[];
    learningGoals?: string[];
    estimatedTime?: string;
  };
  dialogue?: Array<{
    speaker?: string;
    text?: string;
    purpose?: string;
  }>;
}

interface CourseSection {
  title: string;
  content?: string;
  metadata?: {
    prerequisites?: string[];
    learningGoals?: string[];
    estimatedTime: string;
  };
  conversation?: {
    title: string;
    metadata: {
      prerequisites: string[];
      learningGoals: string[];
      estimatedTime: string;
    };
    dialogue: Array<{
      speaker: string;
      text: string;
      purpose: string;
    }>;
  };
  dialogue?: Array<{
    speaker: string;
    text: string;
    purpose: string;
  }>;
}

interface CourseData {
  courseName: string;
  template: string;
  persona: string;
  files: string[];
  processedSections: ProcessedSection[];
  summary?: string;
}

// Add new interface for learning points
interface LearningProgress {
  earned: number;
  target: number;
  lastMonth: number;
}

// Add this new interface near the top with other interfaces
interface SkillLevel {
  value: number;
  label: string;
  description: string;
  color: string;
}

// Add this constant for skill levels
const skillLevels: SkillLevel[] = [
  {
    value: 0,
    label: 'Beginner',
    description: 'New to the subject',
    color: '#10B981'
  },
  {
    value: 33,
    label: 'Elementary',
    description: 'Basic understanding, building knowledge',
    color: '#3B82F6'
  },
  {
    value: 66,
    label: 'Intermediate',
    description: 'Good working knowledge',
    color: '#A855F7'
  },
  {
    value: 100,
    label: 'Advanced',
    description: 'Expert level understanding',
    color: '#EC4899'
  }
];

// Add new interface for document source
interface DocumentSource {
  type: 'pdf' | 'url';
  content: File[] | string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    language: '',
    audienceLevel: '',
    introInstructions: '',
    closingInstructions: '',
    segmentTransitions: '',
    focusAreas: '',
    specificInstructions: '',
  });
  const [newPersona, setNewPersona] = useState({
    templateName: '',
    teacherName: '',
    teacherDescription: '',
    studentName: '',
    studentDescription: '',
    language: '',
    style: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<Array<{
    id: number;
    title: string;
    createdAt: string;
    progress: number;
    lastAccessed: string;
    template?: string;
    persona?: string;
    sections?: CourseSection[];
    audioFiles?: AudioFile[];
    audioAvailable: boolean;
    presentationAvailable: boolean;
  }>>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<typeof courses[0] | null>(null);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [existingCourse, setExistingCourse] = useState<{ id: number; title: string } | null>(null);
  const [learningProgress, setLearningProgress] = useState<LearningProgress>({
    earned: 1246,
    target: 2000,
    lastMonth: 1100
  });

  // Add voice selection state
  const [selectedExpertVoice, setSelectedExpertVoice] = useState('en-US-AndrewMultilingualNeural');  // Default expert voice
  const [selectedLearnerVoice, setSelectedLearnerVoice] = useState('en-US-AvaMultilingualNeural');  // Default learner voice

  // Add voice options
  const voiceOptions = [
    { value: 'en-US-JennyNeural', label: 'Jenny (Female)', gender: 'Female' },
    { value: 'en-US-TonyNeural', label: 'Tony (Male)', gender: 'Male' },
    { value: 'en-US-AriaNeural', label: 'Aria (Female)', gender: 'Female' },
    { value: 'en-US-DavisNeural', label: 'Davis (Male)', gender: 'Male' },
    { value: 'en-US-GuyNeural', label: 'Guy (Male)', gender: 'Male' },
    { value: 'en-US-AmberNeural', label: 'Amber (Female)', gender: 'Female' },
    { value: 'en-US-AnaNeural', label: 'Ana (Female)', gender: 'Female' },
    { value: 'en-US-AshleyNeural', label: 'Ashley (Female)', gender: 'Female' },
    { value: 'en-US-BrandonNeural', label: 'Brandon (Male)', gender: 'Male' },
    { value: 'en-US-ChristopherNeural', label: 'Christopher (Male)', gender: 'Male' },
    { value: 'en-US-CoraNeural', label: 'Cora (Female)', gender: 'Female' },
    { value: 'en-US-ElizabethNeural', label: 'Elizabeth (Female)', gender: 'Female' },
    { value: 'en-US-EricNeural', label: 'Eric (Male)', gender: 'Male' },
    { value: 'en-US-JacobNeural', label: 'Jacob (Male)', gender: 'Male' },
    { value: 'en-US-MichelleNeural', label: 'Michelle (Female)', gender: 'Female' },
    { value: 'en-US-MonicaNeural', label: 'Monica (Female)', gender: 'Female' },
    { value: 'en-US-NancyNeural', label: 'Nancy (Female)', gender: 'Female' },
    { value: 'en-US-RogerNeural', label: 'Roger (Male)', gender: 'Male' },
    { value: 'en-US-SaraNeural', label: 'Sara (Female)', gender: 'Female' },
    { value: 'en-US-SteffanNeural', label: 'Steffan (Male)', gender: 'Male' }
  ];

  // Add voice configuration state
  const [voiceConfig, setVoiceConfig] = useState({
    english: {
      expert: {
        voice: 'en-US-AndrewMultilingualNeural',
        style: 'professional',
        language: 'en-US'
      },
      learner: {
        voice: 'en-US-AvaMultilingualNeural',
        style: 'friendly',
        language: 'en-US'
      }
    },
    german: {
      expert: {
        voice: 'de-DE-KillianNeural',
        style: 'professional',
        language: 'de-DE'
      },
      learner: {
        voice: 'de-DE-MajaNeural',
        style: 'friendly',
        language: 'de-DE'
      }
    },
    swissgerman: {
      expert: {
        voice: 'de-CH-JanNeural',
        style: 'professional',
        language: 'de-CH'
      },
      learner: {
        voice: 'de-CH-LeniNeural',
        style: 'friendly',
        language: 'de-CH'
      }
    }
  });

  // Add voice selection component
  const VoiceSelector = () => (
    <div className="grid grid-cols-2 gap-6 mt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Expert Voice</label>
        <Select value={selectedExpertVoice} onValueChange={setSelectedExpertVoice}>
          <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
            <SelectValue placeholder="Select expert voice" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-[300px]">
            {voiceOptions.map((voice) => (
              <SelectItem key={voice.value} value={voice.value} className="text-white hover:bg-gray-700">
                <div className="flex items-center gap-2">
                  <span>{voice.label}</span>
                  <span className="text-xs text-gray-400">({voice.gender})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Learner Voice</label>
        <Select value={selectedLearnerVoice} onValueChange={setSelectedLearnerVoice}>
          <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
            <SelectValue placeholder="Select learner voice" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-[300px]">
            {voiceOptions.map((voice) => (
              <SelectItem key={voice.value} value={voice.value} className="text-white hover:bg-gray-700">
                <div className="flex items-center gap-2">
                  <span>{voice.label}</span>
                  <span className="text-xs text-gray-400">({voice.gender})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Add this to your component's constants
  const courseTemplates: CourseTemplate[] = [
    {
      id: 'code-explainer',
      title: 'Code Explainer',
      description: 'Step-by-step explanation of code with examples and best practices',
      duration: '20-30 minutes',
    },
    {
      id: 'educational-deep-dive',
      title: 'Educational Deep Dive',
      description: 'In-depth exploration of complex topics',
      duration: '30-45 minutes',
    },
    {
      id: 'technical-presentation',
      title: 'Technical Presentation',
      description: 'Detailed technical walkthrough with code examples and diagrams',
      duration: '25-35 minutes',
    },
    {
      id: 'quick-industry-update',
      title: 'Quick Industry Update',
      description: 'Concise overview of latest developments',
      duration: '15-20 minutes',
    },
    {
      id: 'engaging-podcast',
      title: 'Engaging Podcast',
      description: 'Share expert insights and explain concepts',
      duration: '20-30 minutes',
    },
    {
      id: 'rapid-refresher',
      title: 'Rapid Refresher',
      description: 'Quick memory refresh of essential concepts',
      duration: '10-15 minutes',
    },
    {
      id: 'executive-summary',
      title: 'Executive Summary',
      description: 'Strategic overview for high-level decision making',
      duration: '15-20 minutes',
    }
  ];

  // Add this to your component's state declarations
  const [skillLevel, setSkillLevel] = useState<number>(0);

  // Add this helper function to get the current skill level details
  const getCurrentSkillLevel = (value: number): SkillLevel => {
    return skillLevels.reduce((prev, curr) => {
      return Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev;
    });
  };

  // Update the file state to handle both PDF and URL
  const [documentSource, setDocumentSource] = useState<DocumentSource>({
    type: 'pdf',
    content: []
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/signin');
      }
    };

    checkAuth();
  }, [navigate]);

  // Load courses on component mount
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/courses');
        if (!response.ok) {
          throw new Error('Failed to load courses');
        }
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error('Error loading courses:', error);
        toast.error('Failed to load courses', {
          description: 'Please try refreshing the page',
          duration: 3000
        });
      }
    };

    loadCourses();
  }, []);

  // Handle new course from CourseCanvas
  useEffect(() => {
    if (location.state?.newCourse) {
      const { newCourse } = location.state;
      
      // Update courses list
      setCourses(prevCourses => [
        {
          id: prevCourses.length + 1,
          title: newCourse.title,
          createdAt: newCourse.createdAt,
          progress: 25, // Start new courses at 25%
          lastAccessed: newCourse.lastAccessed,
          template: newCourse.template,
          persona: newCourse.persona,
          audioFiles: newCourse.audioFiles,
          audioAvailable: true,
          presentationAvailable: true
        },
        ...prevCourses
      ]);

      // Clear the navigation state
      navigate(location.pathname, { replace: true, state: {} });

      // Show success message
      toast.success(`Course "${newCourse.title}" is ready!`, {
        description: "Your new course has been added to your dashboard.",
        duration: 3000
      });
    }
  }, [location.state, navigate]);

  // Handle course deletion
  const handleDeleteCourse = async (course: typeof courses[0]) => {
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };

  // Update the handleConfirmDelete function
  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;

    try {
      // Delete course files first
      const deleteFilesResponse = await fetch('http://localhost:5001/delete-course-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseName: courseToDelete.title,
          audioFiles: courseToDelete.audioFiles || []
        })
      });

      if (!deleteFilesResponse.ok) {
        throw new Error('Failed to delete course files');
      }

      // Update UI immediately after successful deletion
      const updatedCourses = courses.filter(course => course.id !== courseToDelete.id);
      setCourses(updatedCourses);
      
      toast.success('Course deleted successfully', {
        description: 'All related files have been removed'
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course', {
        description: 'Please try again or contact support'
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  // Add this function after other state declarations
  const checkAudioFilesExist = async (courseName: string) => {
    try {
      const sanitizedCourseName = courseName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const response = await fetch(`http://localhost:5001/api/courses/${sanitizedCourseName}`);
      
      if (response.ok) {
        const courseData = await response.json();
        // Check if the course has audio files
        if (courseData.audioFiles && courseData.audioFiles.length > 0) {
          // Verify if the audio files physically exist
          const verifyResponse = await fetch('http://localhost:5001/api/verify-audio-files', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              audioFiles: courseData.audioFiles,
              courseName: sanitizedCourseName
            })
          });

          if (verifyResponse.ok) {
            const { allFilesExist } = await verifyResponse.json();
            return allFilesExist;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking audio files:', error);
      return false;
    }
  };

  // Update the handlePlayCourse function
  const handlePlayCourse = async (course: typeof courses[0]) => {
    const hasAudioFiles = await checkAudioFilesExist(course.title);
    
    if (!hasAudioFiles) {
      toast.error('Audio files not found', {
        description: 'Please transform the course to audio first.',
        duration: 3000
      });
      return;
    }

    try {
      // Fetch complete course data
      const response = await fetch(`http://localhost:5001/api/courses/${course.title}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course data');
      }
      const courseData = await response.json();

      // Navigate with complete course data
      navigate('/audio', {
        state: {
          courseName: course.title,
          sections: courseData.processedSections,
          audioFiles: courseData.audioFiles,
          files: courseData.files // Include the files array containing PDF filename
        },
        replace: true,
      });
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error('Failed to load course data');
    }
  };

  // Update the handlePlayVideoCourse function
  const handlePlayVideoCourse = async (course: typeof courses[0]) => {
    const toastId = 'loading-presentation';
    try {
      // Show loading toast
      toast.loading('Loading presentation...', { id: toastId });

      // Sanitize course name for URL
      const sanitizedCourseName = course.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      
      // First check if presentation file exists
      const presentationFile = `${sanitizedCourseName}_presentation.json`;
      const checkResponse = await fetch(`http://localhost:5001/api/courses/${sanitizedCourseName}/${presentationFile}`);
      
      if (!checkResponse.ok) {
        throw new Error('Presentation file not found');
      }

      // Dismiss loading toast
      toast.dismiss(toastId);

      // Navigate to published presentation with course data
      navigate('/published-presentation', {
        state: {
          courseName: sanitizedCourseName,
          theme: 'black', // default theme
          presentationFile: presentationFile
        }
      });

    } catch (error) {
      console.error('Error loading presentation:', error);
      toast.dismiss(toastId);
      
      // Show error toast
      toast.error('Failed to load presentation', {
        description: error instanceof Error ? error.message : 'Please try again or contact support'
      });
      
      // If presentation file doesn't exist, navigate to presentation canvas to create one
      if (error instanceof Error && error.message === 'Presentation file not found') {
        navigate('/presentation-canvas', {
          state: {
            courseName: course.title,
            isNewPresentation: true
          }
        });
      }
    }
  };

  // Add this new component for the document source selector
  const DocumentSourceSelector = () => (
    <div className="p-4 rounded-lg border-2 border-dashed transition-all duration-300 hover:bg-gray-800/50">
      <div className="flex gap-4 mb-4">
        <Button
          variant="ghost"
          onClick={() => setDocumentSource(prev => ({ ...prev, type: 'pdf' }))}
          className={cn(
            "flex-1 h-12",
            documentSource.type === 'pdf' 
              ? "bg-purple-500/10 text-purple-400 border-purple-500/50" 
              : "bg-gray-700/50 text-gray-400 border-gray-700"
          )}
        >
          <FileText className="h-4 w-4 mr-2" />
          PDF Document
        </Button>
        <Button
          variant="ghost"
          onClick={() => setDocumentSource(prev => ({ ...prev, type: 'url' }))}
          className={cn(
            "flex-1 h-12",
            documentSource.type === 'url' 
              ? "bg-purple-500/10 text-purple-400 border-purple-500/50" 
              : "bg-gray-700/50 text-gray-400 border-gray-700"
          )}
        >
          <Globe className="h-4 w-4 mr-2" />
          Web URL
        </Button>
      </div>

      {documentSource.type === 'pdf' ? (
        <>
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            id="pdf-upload"
          />
          <label
            htmlFor="pdf-upload"
            className="cursor-pointer flex items-center gap-4"
          >
            <div className="p-2 rounded-full bg-purple-500/10">
              <Upload className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h4 className="text-base text-white">Upload PDF</h4>
              <p className="text-sm text-gray-400">Upload your existing PDF documents</p>
              <p className="text-xs text-gray-500 mt-1">PDF files only • Max 50MB</p>
            </div>
          </label>

          {Array.isArray(documentSource.content) && documentSource.content.length > 0 && (
            <div className="mt-4 space-y-2">
              {documentSource.content.map((file: File, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-800/30 rounded p-2 group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-purple-400 shrink-0" />
                    <span className="text-sm text-gray-300 truncate">{file.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFile(file);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div>
            <Input
              type="url"
              placeholder="Enter website URL (e.g., https://github.com)"
              value={typeof documentSource.content === 'string' ? documentSource.content : ''}
              onChange={(e) => setDocumentSource(prev => ({ ...prev, content: e.target.value }))}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 mt-2">Make sure the URL is publicly accessible</p>
          </div>
        </div>
      )}
    </div>
  );

  // Update handleNext to include web scraping
  const handleNext = async () => {
    if (!courseName || !selectedTemplate || !selectedPersona) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (
      (documentSource.type === 'pdf' && (!Array.isArray(documentSource.content) || documentSource.content.length === 0)) ||
      (documentSource.type === 'url' && (!documentSource.content || typeof documentSource.content !== 'string'))
    ) {
      toast.error('Please provide either a PDF file or a valid URL');
      return;
    }

    setIsLoading(true);
    try {
      const sanitizedCourseName = courseName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

      // Check if course exists
      const checkResponse = await fetch(`http://localhost:5001/api/courses/${sanitizedCourseName}`);
      
      if (checkResponse.ok) {
        const courseData = await checkResponse.json();
        if (courseData.processedSections && courseData.processedSections.length > 0) {
          navigate('/course-canvas', { 
            state: courseData,
            replace: true
          });
          setIsLoading(false);
          return;
        }
      }

      let endpoint = documentSource.type === 'pdf' ? 'process-pdf' : 'process-url';
      let requestData;

      if (documentSource.type === 'pdf') {
        const formData = new FormData();
        (documentSource.content as File[]).forEach(file => {
          formData.append('file', file);
        });
        formData.append('template', selectedTemplate);
        formData.append('persona', selectedPersona);
        formData.append('courseName', courseName);
        formData.append('skillLevel', skillLevel.toString());
        formData.append('voiceConfig', JSON.stringify(selectedVoiceConfig));
        requestData = formData;
      } else {
        requestData = JSON.stringify({
          url: documentSource.content,
          template: selectedTemplate,
          persona: selectedPersona,
          courseName: courseName,
          skillLevel: skillLevel,
          voiceConfig: selectedVoiceConfig
        });
      }

      const response = await fetch(`http://localhost:5001/${endpoint}`, {
        method: 'POST',
        body: requestData,
        headers: documentSource.type === 'url' ? {
          'Content-Type': 'application/json'
        } : undefined
      });

      if (!response.ok) {
        throw new Error('Failed to process course');
      }

      const data = await response.json();

      if (data.success && data.data) {
        navigate('/course-canvas', { 
          state: data.data,
          replace: true
        });
        setIsLoading(false);
        return;
      }

      // If no valid data, wait and retry
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry

      // After all retries, verify if the course was actually saved
      const verifyResponse = await fetch(`http://localhost:5001/api/courses/${sanitizedCourseName}`);
      if (verifyResponse.ok) {
        const savedCourse = await verifyResponse.json();
        if (savedCourse.processedSections && savedCourse.processedSections.length > 0) {
          // Course was saved successfully despite the processing delay
          navigate('/course-canvas', { 
            state: savedCourse,
            replace: true
          });
          return;
        }
      }

      // If we get here, we need to use default sections
      const courseData = {
        courseName: sanitizedCourseName,
        template: selectedTemplate,
        persona: selectedPersona,
        files: selectedFiles.map(file => file.name),
        processedSections: defaultSections,
        skillLevel: skillLevel
      };

      // Save the default course data
      const saveResponse = await fetch('http://localhost:5001/save-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseName: sanitizedCourseName,
          data: courseData
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save course data');
      }

      navigate('/course-canvas', { 
        state: courseData,
        replace: true
      });

      toast.warning('Using default sections temporarily', {
        description: 'The course is still being processed. You can refresh the page in a few moments to see the processed content.',
        duration: 5000
      });
    } catch (error) {
      console.error('Error processing course:', error);
      toast.error('Failed to process course', {
        description: 'Please try again or contact support'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to save course data to JSON file
  const saveToJsonFile = async (courseData: CourseData) => {
    try {
      const sanitizedCourseName = courseData.courseName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const response = await fetch('http://localhost:5001/save-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseName: sanitizedCourseName,
          data: courseData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save course data');
      }

      toast.success("Course data saved successfully", {
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to save course data:', error);
      toast.error("Failed to save course data", {
        duration: 3000
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleCreateTemplate = () => {
    // Handle template creation logic here
    console.log('Creating template:', newTemplate);
    setIsTemplateModalOpen(false);
    setNewTemplate({
      name: '',
      description: '',
      language: '',
      audienceLevel: '',
      introInstructions: '',
      closingInstructions: '',
      segmentTransitions: '',
      focusAreas: '',
      specificInstructions: '',
    });
  };

  const handleCreatePersona = () => {
    // Handle persona creation logic here
    console.log('Creating persona:', newPersona);
    setIsPersonaModalOpen(false);
    setNewPersona({
      templateName: '',
      teacherName: '',
      teacherDescription: '',
      studentName: '',
      studentDescription: '',
      language: '',
      style: ''
    });
  };

  const handleTemplateChange = (value: string) => {
    if (value === 'create-new') {
      setIsTemplateModalOpen(true);
    } else {
      setSelectedTemplate(value);
    }
  };

  // Update handlePersonaChange to set the correct voices based on selected persona
  const handlePersonaChange = (value: string) => {
    setSelectedPersona(value);
    
    // Set the appropriate voices based on the selected persona
    switch (value) {
      case 'andrew-ava':
        setSelectedExpertVoice(voiceConfig.english.expert.voice);
        setSelectedLearnerVoice(voiceConfig.english.learner.voice);
        break;
      case 'killian-maja':
        setSelectedExpertVoice(voiceConfig.german.expert.voice);
        setSelectedLearnerVoice(voiceConfig.german.learner.voice);
        break;
      case 'jan-leni':
        setSelectedExpertVoice(voiceConfig.swissgerman.expert.voice);
        setSelectedLearnerVoice(voiceConfig.swissgerman.learner.voice);
        break;
      default:
        // Default to English voices
        setSelectedExpertVoice(voiceConfig.english.expert.voice);
        setSelectedLearnerVoice(voiceConfig.english.learner.voice);
    }
  };

  // Update removeFile handler
  const removeFile = (fileToRemove: File) => {
    if (documentSource.type === 'pdf' && Array.isArray(documentSource.content)) {
      setDocumentSource(prev => ({
        ...prev,
        content: (prev.content).filter(file => file !== fileToRemove)
      }));
    }
  };

  // Update handleFileChange
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setDocumentSource(prev => ({
        ...prev,
        content: filesArray
      }));
    }
  };

  const handleEditCourse = async (course: typeof courses[0]) => {
    try {
      // Show loading toast
      toast.loading('Loading course data...', { id: 'loading-course' });

      // Sanitize the course name
      const sanitizedCourseName = course.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

      // Fetch complete course data from backend
      const response = await fetch(`http://localhost:5001/api/courses/${sanitizedCourseName}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course data');
      }
      
      const courseData = await response.json();
      
      // Validate required data
      if (!courseData.processedSections || !courseData.files) {
        throw new Error('Invalid course data structure');
      }
      
      // Ensure the courseData has the required structure
      const processedData = {
        courseName: courseData.courseName || course.title,
        template: courseData.template || '',
        persona: courseData.persona || '',
        files: courseData.files || [],
        processedSections: courseData.processedSections || [],
        audioFiles: courseData.audioFiles || []
      };
      
      // Dismiss loading toast
      toast.dismiss('loading-course');
      
      // Navigate with complete course data
      navigate('/course-canvas', { 
        state: processedData,
        replace: false 
      });
    } catch (error) {
      console.error('Error fetching course data:', error);
      // Dismiss loading toast and show error
      toast.dismiss('loading-course');
      toast.error('Failed to load course data', {
        description: 'Please try again or contact support'
      });
    }
  };

  // Add this helper function near the top of the component
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not accessed yet';
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) 
      ? date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '.')
      : '01.01.2025';
  };

  // Update the getProgressStatus function
  const getProgressStatus = (progress: number) => {
    if (progress === 100) return { label: '', color: 'text-emerald-400' };
    if (progress >= 75) return { label: '', color: 'text-blue-400' };
    if (progress >= 50) return { label: '', color: 'text-purple-400' };
    if (progress >= 25) return { label: '', color: 'text-amber-400' };
    return { label: '', color: 'text-gray-400' };
  };

  // Update the getRandomProgress function
  const getRandomProgress = (courseId: number) => {
    const seed = courseId * 17;
    const baseProgress = [35, 45, 60, 75, 85, 95, 100];
    const index = seed % baseProgress.length;
    return baseProgress[index];
  };

  // Add the handleOpenExistingCourse function
  const handleOpenExistingCourse = () => {
    if (existingCourse) {
      // Convert course title to a URL-friendly format
      const courseNameParam = existingCourse.title.toLowerCase().replace(/\s+/g, '_');
      navigate('/course-canvas', { 
        state: { courseName: courseNameParam },
        replace: true 
      });
    }
    setIsDuplicateDialogOpen(false);
    setExistingCourse(null);
    setIsExpanded(false);
  };

  // Add the handleRenameCourse function
  const handleRenameCourse = () => {
    setIsDuplicateDialogOpen(false);
    setExistingCourse(null);
    // Keep the form open for renaming
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

      {/* Main Content */}
      {isLoading ? (
        <div className="container mx-auto px-6 py-8">
          <AnimatedLoadingSkeleton />
        </div>
      ) : (
        <div className="container mx-auto px-6 py-8 pb-32">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Courses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 hover:bg-gray-800/80 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-full">
                  <BookOpen className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-300">Total Courses</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{courses.length}</span>
                    <span className="text-sm text-emerald-400 flex items-center">
                      <ChevronRight className="h-4 w-4 rotate-90" />
                      23% from last month
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Learning Points */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 hover:bg-gray-800/80 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Learning Points</p>
                  <div className="mt-2">
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                      {learningProgress.earned}/{learningProgress.target}
                    </p>
                    <div className="mt-2 w-full bg-gray-700 rounded-full h-2.5 relative overflow-hidden">
                      <div className="absolute inset-0">
                        <div className="animate-shimmer -translate-x-full h-full w-[200%] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                      </div>
                      <div 
                        className="relative bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full"
                        style={{ width: `${(learningProgress.earned / learningProgress.target) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Coins className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </motion.div>

            {/* Badges & Rank */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 hover:bg-gray-800/80 transition-all duration-300 relative overflow-hidden"
            >
              {/* Background Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="p-3 bg-amber-500/10 rounded-full">
                      <Trophy className="h-6 w-6 text-amber-400" />
                    </div>
                    {/* Small badge indicator */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                      <span className="animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-300">Badges</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">12</span>
                        <span className="text-sm text-amber-400">Badges</span>
                      </div>
                      <div className="h-4 w-px bg-gray-700" />
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-sm font-medium bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                          Gold League
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Create Course Card */}
          {!isExpanded ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mb-8"
            >
              <Card 
                className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group overflow-hidden"
                onClick={() => setIsExpanded(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader>
                  <div>
                    <CardTitle className="text-2xl font-semibold text-white">Create New Course</CardTitle>
                    <p className="text-gray-400 mt-1">Transform your documents into interactive learning experiences</p>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter a descriptive name for your course"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 h-12"
                      />
                    </div>
                    <Button
                      className="h-12 px-6 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(true);
                      }}
                    >
                      Get Started
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <Card className="bg-gray-800/50 border-gray-700 mb-8 relative overflow-hidden">
                <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/50 via-pink-500/50 to-purple-600/50 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <div className="relative bg-gray-800/50 rounded-lg p-6">
                  <CardHeader className="border-b border-gray-700 px-0 pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Plus className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-semibold text-white">Create New Course</CardTitle>
                          <p className="text-gray-400 mt-1">Fill in the details below to create your course</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(false)}
                        className="rounded-full hover:bg-gray-700/50"
                      >
                        <X className="h-5 w-5 text-gray-400" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8 pt-6 px-0">
                    {/* Course Name with Icon */}
                    <div className="flex-1 space-y-2">
                      <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-purple-400" />
                        Course Name
                      </label>
                      <Input
                        placeholder="Enter a descriptive name for your course"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 h-12"
                      />
                    </div>

                    {/* Templates Section - Only show if course name exists */}
                    {courseName.trim() !== '' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        {/* Course Template */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-purple-400" />
                            Course Template
                          </label>
                          <Select onValueChange={handleTemplateChange}>
                            <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white h-[80px] items-start pt-3">
                              <SelectValue placeholder="Choose how you want to structure your course" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              <SelectItem value="code-explainer" className="text-white hover:bg-gray-700">
                                <div className="py-2 space-y-1">
                                  <div className="font-medium flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-purple-400" />
                                    Code Explainer
                                  </div>
                                  <div className="text-sm text-gray-400">Step-by-step explanation of code with examples and best practices</div>
                                  <div className="text-xs text-purple-400/80">{courseTemplates[0].duration}</div>
                                </div>
                              </SelectItem>
                              <SelectItem value="educational-deep-dive" className="text-white hover:bg-gray-700">
                                <div className="py-2 space-y-1">
                                  <div className="font-medium flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-purple-400" />
                                    Educational Deep Dive
                                  </div>
                                  <div className="text-sm text-gray-400">In-depth exploration of complex topics</div>
                                  <div className="text-xs text-purple-400/80">{courseTemplates[1].duration}</div>
                                </div>
                              </SelectItem>
                              <SelectItem value="technical-presentation" className="text-white hover:bg-gray-700">
                                <div className="py-2 space-y-1">
                                  <div className="font-medium flex items-center gap-2">
                                    <Presentation className="h-4 w-4 text-purple-400" />
                                    Technical Presentation
                                  </div>
                                  <div className="text-sm text-gray-400">Detailed technical walkthrough with code examples and diagrams</div>
                                  <div className="text-xs text-purple-400/80">{courseTemplates[2].duration}</div>
                                </div>
                              </SelectItem>
                              <SelectItem value="quick-industry-update" className="text-white hover:bg-gray-700">
                                <div className="py-2 space-y-1">
                                  <div className="font-medium flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-purple-400" />
                                    Quick Industry Update
                                  </div>
                                  <div className="text-sm text-gray-400">Concise overview of latest developments</div>
                                  <div className="text-xs text-purple-400/80">{courseTemplates[3].duration}</div>
                                </div>
                              </SelectItem>
                              <SelectItem value="engaging-podcast" className="text-white hover:bg-gray-700">
                                <div className="py-2 space-y-1">
                                  <div className="font-medium flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-purple-400" />
                                    Engaging Podcast
                                  </div>
                                  <div className="text-sm text-gray-400">Share expert insights and explain concepts</div>
                                  <div className="text-xs text-purple-400/80">{courseTemplates[4].duration}</div>
                                </div>
                              </SelectItem>
                              <SelectItem value="rapid-refresher" className="text-white hover:bg-gray-700 border-t border-gray-700">
                                <div className="py-2 space-y-1">
                                  <div className="font-medium flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-purple-400" />
                                    Rapid Refresher
                                  </div>
                                  <div className="text-sm text-gray-400">Quick memory refresh of essential concepts</div>
                                  <div className="text-xs text-purple-400/80">{courseTemplates[5].duration}</div>
                                </div>
                              </SelectItem>
                              <SelectItem value="executive-summary" className="text-white hover:bg-gray-700">
                                <div className="py-2 space-y-1">
                                  <div className="font-medium flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-purple-400" />
                                    Executive Summary
                                  </div>
                                  <div className="text-sm text-gray-400">Strategic overview for high-level decision making</div>
                                  <div className="text-xs text-purple-400/80">{courseTemplates[6].duration}</div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Language and Persona */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Languages className="h-4 w-4 text-purple-400" />
                            Language and Persona
                          </label>
                          <Select onValueChange={handlePersonaChange}>
                            <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white h-[80px] items-start pt-3">
                              <SelectValue placeholder="Select a persona pair and their preferred language" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              <SelectItem value="andrew-ava" className="text-white hover:bg-gray-700">
                                <div className="py-2 space-y-1">
                                  <div className="font-medium flex items-center gap-2">
                                    <Users className="h-4 w-4 text-purple-400" />
                                    Andrew and Ava
                                  </div>
                                  <div className="text-sm text-gray-400">Expert and learner with multilingual capabilities</div>
                                  <div className="text-xs text-purple-400/80">English • Multilingual</div>
                                </div>
                              </SelectItem>
                              <SelectItem value="killian-maja" className="text-white hover:bg-gray-700">
                                <div className="py-2 space-y-1">
                                  <div className="font-medium flex items-center gap-2">
                                    <Users className="h-4 w-4 text-purple-400" />
                                    Killian and Maja
                                  </div>
                                  <div className="text-sm text-gray-400">Native German speakers with technical expertise</div>
                                  <div className="text-xs text-purple-400/80">German • Technical Style</div>
                                </div>
                              </SelectItem>
                              <SelectItem value="jan-leni" className="text-white hover:bg-gray-700">
                                <div className="py-2 space-y-1">
                                  <div className="font-medium flex items-center gap-2">
                                    <Users className="h-4 w-4 text-purple-400" />
                                    Jan and Leni
                                  </div>
                                  <div className="text-sm text-gray-400">Swiss German dialect specialists</div>
                                  <div className="text-xs text-purple-400/80">Swiss German • Conversational</div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Document Source & Skill Level - Two Column Layout */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Skill Level Box */}
                      <div className="p-4 rounded-lg bg-gray-900/30">
                        {/* Level Display */}
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h4 className="text-white text-base">
                              {getCurrentSkillLevel(skillLevel).label}
                            </h4>
                            <p className="text-gray-400 text-sm">
                              {getCurrentSkillLevel(skillLevel).description}
                            </p>
                          </div>
                          <span className="text-gray-400">{skillLevel}%</span>
                        </div>

                        {/* Slider Container */}
                        <div className="relative">
                          {/* Background Track */}
                          <div className="h-[2px] bg-gray-800">
                            <div 
                              className="h-full transition-all duration-200"
                              style={{
                                background: `linear-gradient(to right, #10B981, #3B82F6, #A855F7, #EC4899)`,
                                width: `${skillLevel}%`
                              }}
                            />
                          </div>

                          {/* Marker Points */}
                          <div className="absolute -top-1 left-0 right-0 flex justify-between">
                            {skillLevels.map((level) => (
                              <div
                                key={level.value}
                                className={cn(
                                  "w-2 h-2 rounded-full transition-colors duration-200",
                                  skillLevel >= level.value ? "opacity-100" : "opacity-30"
                                )}
                                style={{ backgroundColor: level.color }}
                              />
                            ))}
                          </div>

                          {/* Range Input */}
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={skillLevel}
                            onChange={(e) => setSkillLevel(Number(e.target.value))}
                            className="absolute -top-1 left-0 w-full h-4 opacity-0 cursor-pointer"
                            style={{
                              WebkitAppearance: 'none',
                              background: 'transparent'
                            }}
                          />

                          {/* Slider Thumb */}
                          <div 
                            className="absolute -top-1 w-2 h-2 rounded-full bg-white border-2 border-blue-500 transition-all duration-200 pointer-events-none"
                            style={{ 
                              left: `calc(${skillLevel}% - 4px)`,
                              display: skillLevel > 0 ? 'block' : 'none'
                            }}
                          />
                        </div>
                      </div>

                      {/* Replace the PDF Upload Box with DocumentSourceSelector */}
                      <DocumentSourceSelector />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-700">
                      <Button
                        variant="ghost"
                        onClick={() => setIsExpanded(false)}
                        className="bg-gray-800/50 text-white hover:bg-gray-700/50 hover:text-purple-400 transition-all duration-300 px-6"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleNext}
                        disabled={!courseName || !selectedTemplate || !selectedPersona || !documentSource.content}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8"
                      >
                        Create Course
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Existing Courses */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-white flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-purple-400" />
              Your Personalised Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => {
                // Calculate progress once per course render
                const progress = getRandomProgress(course.id);
                const progressStatus = getProgressStatus(progress);
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 hover:border-purple-500/50 hover:bg-gray-800/80 transition-all duration-300"
                  >
                    {/* Course Header with Title and Play Button */}
                    <div className="flex flex-col gap-4 mb-6">
                      {/* Title Section */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-purple-500/10 shrink-0">
                          <BookOpen className="h-5 w-5 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors break-words">
                          {course.title}
                        </h3>
                      </div>

                      {/* Course Actions - Now below the title */}
                      <div className="flex items-center gap-2 ml-11">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditCourse(course)}
                          className="w-8 h-8 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePlayCourse(course)}
                          className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                          title="Play Audio Course"
                        >
                          <Headphones className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (!course.presentationAvailable) {
                              toast.error('Presentation not available', {
                                description: 'Please create a presentation for this course first.',
                                duration: 3000
                              });
                              return;
                            }
                            handlePlayVideoCourse(course);
                          }}
                          className={cn(
                            "w-8 h-8 rounded-lg",
                            course.presentationAvailable 
                              ? "bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20" 
                              : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                          )}
                          disabled={!course.presentationAvailable}
                          title={course.presentationAvailable ? "Play Presentation Course" : "Presentation not available"}
                        >
                          <Presentation className="h-4 w-4" />
                        </Button>

                        {/* Add a flex-grow div to create space */}
                        <div className="flex-grow" />

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCourse(course)}
                          className="w-8 h-8 rounded-lg bg-gray-800/50 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Add a visual indicator for audio availability */}
                    {!course.audioAvailable && (
                      <div className="absolute top-2 right-2">
                        <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">
                          Audio not available
                        </span>
                      </div>
                    )}
                    
                    {/* Progress Section */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-300">Course Progress</span>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-medium", progressStatus.color)}>
                            {progress}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={cn(
                            "h-2.5 rounded-full transition-all duration-300 relative",
                            progress === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-purple-500 to-purple-400"
                          )}
                          style={{ width: `${progress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20">
                            <div className="animate-shimmer -translate-x-full h-full w-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Course Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="h-4 w-4 text-purple-400/70" />
                        <p>Created {formatDate(course.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="h-4 w-4 text-purple-400/70" />
                        <p>Accessed {formatDate(course.lastAccessed)}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ChatBot */}
      <ChatBot mode="recommendation" />

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

      {/* Add the modals */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Course Template</DialogTitle>
            <DialogDescription className="text-gray-400">
              Define a new template for your courses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Information - First Row */}
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Template Name</label>
                <Input
                  placeholder="Enter template name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Language</label>
                <Select 
                  value={newTemplate.language}
                  onValueChange={(value) => setNewTemplate({ ...newTemplate, language: value })}
                >
                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="english" className="text-white hover:bg-gray-700">English</SelectItem>
                    <SelectItem value="german" className="text-white hover:bg-gray-700">German</SelectItem>
                    <SelectItem value="french" className="text-white hover:bg-gray-700">French</SelectItem>
                    <SelectItem value="italian" className="text-white hover:bg-gray-700">Italian</SelectItem>
                    <SelectItem value="spanish" className="text-white hover:bg-gray-700">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Target Audience Level</label>
                <Select 
                  value={newTemplate.audienceLevel}
                  onValueChange={(value) => setNewTemplate({ ...newTemplate, audienceLevel: value })}
                >
                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="beginner" className="text-white hover:bg-gray-700">Beginner</SelectItem>
                    <SelectItem value="intermediate" className="text-white hover:bg-gray-700">Intermediate</SelectItem>
                    <SelectItem value="advanced" className="text-white hover:bg-gray-700">Advanced</SelectItem>
                    <SelectItem value="expert" className="text-white hover:bg-gray-700">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description - Second Row */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Template Description</label>
              <Textarea
                placeholder="Describe your template..."
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-[80px]"
              />
            </div>

            {/* Instructions - Two Column Layout */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Introduction Instructions</label>
                <Textarea
                  placeholder="Enter introduction instructions..."
                  value={newTemplate.introInstructions}
                  onChange={(e) => setNewTemplate({ ...newTemplate, introInstructions: e.target.value })}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Closing Instructions</label>
                <Textarea
                  placeholder="Enter closing instructions..."
                  value={newTemplate.closingInstructions}
                  onChange={(e) => setNewTemplate({ ...newTemplate, closingInstructions: e.target.value })}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Segment Transitions</label>
                <Textarea
                  placeholder="Enter segment transitions..."
                  value={newTemplate.segmentTransitions}
                  onChange={(e) => setNewTemplate({ ...newTemplate, segmentTransitions: e.target.value })}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Focus Areas</label>
                <Textarea
                  placeholder="Enter focus areas..."
                  value={newTemplate.focusAreas}
                  onChange={(e) => setNewTemplate({ ...newTemplate, focusAreas: e.target.value })}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-[120px]"
                />
              </div>
            </div>

            {/* Specific Instructions - Full Width */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Specific Instructions</label>
              <Textarea
                placeholder="Enter specific instructions..."
                value={newTemplate.specificInstructions}
                onChange={(e) => setNewTemplate({ ...newTemplate, specificInstructions: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsTemplateModalOpen(false);
                setNewTemplate({
                  name: '',
                  description: '',
                  language: '',
                  audienceLevel: '',
                  introInstructions: '',
                  closingInstructions: '',
                  segmentTransitions: '',
                  focusAreas: '',
                  specificInstructions: '',
                });
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={!newTemplate.name || !newTemplate.language || !newTemplate.audienceLevel}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPersonaModalOpen} onOpenChange={setIsPersonaModalOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Teaching Persona</DialogTitle>
            <DialogDescription className="text-gray-400">
              Define a new teaching persona template for your courses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Template Name</label>
                <Input
                  placeholder="Enter template name"
                  value={newPersona.templateName}
                  onChange={(e) => setNewPersona({ ...newPersona, templateName: e.target.value })}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Language</label>
                <Select 
                  value={newPersona.language}
                  onValueChange={(value) => setNewPersona({ ...newPersona, language: value })}
                >
                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="english" className="text-white hover:bg-gray-700">English</SelectItem>
                    <SelectItem value="german" className="text-white hover:bg-gray-700">German</SelectItem>
                    <SelectItem value="french" className="text-white hover:bg-gray-700">French</SelectItem>
                    <SelectItem value="italian" className="text-white hover:bg-gray-700">Italian</SelectItem>
                    <SelectItem value="spanish" className="text-white hover:bg-gray-700">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Teaching Persona Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Teaching Persona</h3>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Teacher Name</label>
                <Input
                  placeholder="Enter teacher name"
                  value={newPersona.teacherName}
                  onChange={(e) => setNewPersona({ ...newPersona, teacherName: e.target.value })}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Teacher Description</label>
                <Textarea
                  placeholder="Describe the teaching persona's characteristics, style, and approach..."
                  value={newPersona.teacherDescription}
                  onChange={(e) => setNewPersona({ ...newPersona, teacherDescription: e.target.value })}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-[100px]"
                />
              </div>
            </div>

            {/* Student Persona Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Student Persona</h3>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Student Name</label>
                <Input
                  placeholder="Enter student name"
                  value={newPersona.studentName}
                  onChange={(e) => setNewPersona({ ...newPersona, studentName: e.target.value })}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Student Description</label>
                <Textarea
                  placeholder="Describe the student persona's characteristics, learning style, and questions they might ask..."
                  value={newPersona.studentDescription}
                  onChange={(e) => setNewPersona({ ...newPersona, studentDescription: e.target.value })}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-[100px]"
                />
              </div>
            </div>

            {/* Teaching Style */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Teaching Style</label>
              <Select 
                value={newPersona.style}
                onValueChange={(value) => setNewPersona({ ...newPersona, style: value })}
              >
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                  <SelectValue placeholder="Select teaching style" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="conversational" className="text-white hover:bg-gray-700">Conversational</SelectItem>
                  <SelectItem value="technical" className="text-white hover:bg-gray-700">Technical</SelectItem>
                  <SelectItem value="academic" className="text-white hover:bg-gray-700">Academic</SelectItem>
                  <SelectItem value="casual" className="text-white hover:bg-gray-700">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPersonaModalOpen(false);
                setNewPersona({
                  templateName: '',
                  teacherName: '',
                  teacherDescription: '',
                  studentName: '',
                  studentDescription: '',
                  language: '',
                  style: ''
                });
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePersona}
              disabled={!newPersona.templateName || !newPersona.teacherName || !newPersona.studentName}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Create Persona Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading && <LoadingSpinner />}

      {/* Add the Alert Dialog near the end of the component */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-800 border border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Course</AlertDialogTitle>
            <div className="text-gray-400">
              <p>This will permanently delete the course "{courseToDelete?.title}" and all related files.</p>
              <div className="mt-4">
                <p className="mb-2">The following will be deleted:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Course audio files</li>
                  <li>Course canvas data</li>
                  <li>PDF documents</li>
                </ul>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              Delete Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add the Duplicate Course Dialog */}
      <AlertDialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <AlertDialogContent className="bg-gray-800 border border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Course Already Exists</AlertDialogTitle>
            <div className="text-gray-400">
              <p>A course with the name "{existingCourse?.title}" already exists.</p>
              <p className="mt-2">Would you like to open the existing course or go back and rename your new course?</p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={handleRenameCourse}
              className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
            >
              Rename Course
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleOpenExistingCourse}
              className="bg-purple-600 hover:bg-purple-700 text-white border-0"
            >
              Open Existing Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;