import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Home, Search, Settings, LogOut, BookOpen, Edit2, Save, X, Share2, Maximize2, Minimize2, HelpCircle, ChevronDown, Check, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ThemeSelector from '../components/ThemeSelector';

interface Theme {
  id: string;
  name: string;
  description: string;
}

const themes: Theme[] = [
  { id: 'black', name: 'Black (Default)', description: 'Black background, white text, blue links' },
  { id: 'white', name: 'White', description: 'White background, black text, blue links' },
  { id: 'league', name: 'League', description: 'Gray background, white text, blue links' },
  { id: 'beige', name: 'Beige', description: 'Beige background, dark text, brown links' },
  { id: 'night', name: 'Night', description: 'Black background, thick white text, orange links' },
  { id: 'serif', name: 'Serif', description: 'Cappuccino background, gray text, brown links' },
  { id: 'simple', name: 'Simple', description: 'White background, black text, blue links' },
  { id: 'solarized', name: 'Solarized', description: 'Cream-colored background, dark green text, blue links' },
  { id: 'moon', name: 'Moon', description: 'Dark blue background, thick grey text, blue links' },
  { id: 'dracula', name: 'Dracula', description: 'Purple black background, thick purple text, pink links' },
  { id: 'sky', name: 'Sky', description: 'Blue background, thin white text, blue links' },
  { id: 'blood', name: 'Blood', description: 'Black background, thin white text, red links' }
];

interface PresentationState {
  courseName: string;
  presentationFile?: string;
}

interface Section {
  title: string;
  type: 'welcome' | 'overview' | 'section_header' | 'section_metadata' | 'content' | 'quiz';
  summary_points?: string[];
  is_quiz?: boolean;
  quiz_questions?: Array<{
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
  }>;
  metadata?: {
    prerequisites: string[];
    learningGoals: string[];
    estimatedTime: string;
  };
}

interface Presentation {
  courseName: string;
  sections: Section[];
}

interface PresentationCanvasProps {
  // ... existing props ...
}

const PresentationCanvas: React.FC<PresentationCanvasProps> = ({ /* existing props */ }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedPoints, setEditedPoints] = useState<string[]>([]);
  const [editedQuizQuestions, setEditedQuizQuestions] = useState<Array<{
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
  }>>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>('black');
  const [showThemeSelector, setShowThemeSelector] = useState<boolean>(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/signin');
  };

  useEffect(() => {
    const loadPresentation = async () => {
      try {
        const state = location.state as PresentationState;
        
        if (!state?.courseName) {
          toast.error('No course name provided');
          navigate('/dashboard');
          return;
        }

        const presentationFile = state.presentationFile || `${state.courseName}_presentation.json`;
        console.log('Loading presentation with:', {
          courseName: state.courseName,
          presentationFile
        });

        const response = await fetch(`http://localhost:5001/api/courses/${state.courseName}/${presentationFile}`);
        
        if (!response.ok) {
          console.error('Failed to load presentation:', response.status, response.statusText);
          throw new Error(`Failed to load presentation: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Loaded presentation data:', data);
        
        if (!data.sections || !Array.isArray(data.sections)) {
          throw new Error('Invalid presentation data format');
        }

        setPresentation(data);
        setIsLoading(false);
        toast.success('Presentation loaded successfully');
      } catch (error) {
        console.error('Error loading presentation:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load presentation');
        navigate('/dashboard');
      }
    };

    loadPresentation();
  }, [location.state, navigate]);

  const goToNextSlide = () => {
    if (presentation && currentSlide < presentation.sections.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const goToPreviousSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'Space') {
        goToNextSlide();
      } else if (event.key === 'ArrowLeft') {
        goToPreviousSlide();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlide, presentation]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo file size should be less than 2MB');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setLogoFile(file);
      setLogoPreview(previewUrl);

      const formData = new FormData();
      formData.append('logo', file);

      fetch('http://localhost:5001/api/upload-logo', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (presentation) {
          const updatedPresentation = {
            ...presentation,
            presentationConfig: {
              ...presentation.presentationConfig,
              logo: {
                src: `/images/${file.name}`,
                position: 'top-left',
                style: {
                  maxHeight: '40px',
                  margin: '10px',
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  zIndex: '1000'
                }
              }
            }
          };
          setPresentation(updatedPresentation);
          toast.success('Logo uploaded successfully');
        }
      })
      .catch(error => {
        console.error('Error uploading logo:', error);
        toast.error('Failed to upload logo');
      });
    }
  };

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
          <p className="text-white">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (!presentation) {
    return null;
  }

  const currentSection = presentation.sections[currentSlide];

  const handleEditClick = () => {
    if (!currentSection) return;
    setEditedTitle(currentSection.title);
    if (currentSection.type === 'quiz' && currentSection.quiz_questions) {
      setEditedQuizQuestions([...currentSection.quiz_questions]);
    } else {
      setEditedPoints(currentSection.summary_points || []);
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (!presentation) return;

      const updatedPresentation = {
        ...presentation,
        sections: presentation.sections.map((section, index) => {
          if (index === currentSlide) {
            if (section.type === 'quiz') {
              return {
                ...section,
                title: editedTitle,
                quiz_questions: editedQuizQuestions
              };
            }
            return {
              ...section,
              title: editedTitle,
              summary_points: editedPoints
            };
          }
          return section;
        })
      };

      const response = await fetch(`http://localhost:5001/api/courses/${presentation.courseName}/${presentation.courseName}_presentation.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPresentation)
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      setPresentation(updatedPresentation);
      setIsEditing(false);
      setEditedTitle('');
      setEditedPoints([]);
      setEditedQuizQuestions([]);
      toast.success('Changes saved successfully');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTitle('');
    setEditedPoints([]);
    setEditedQuizQuestions([]);
  };

  const handlePublish = async () => {
    try {
      if (!presentation) {
        console.error('[PresentationCanvas] No presentation data available');
        return;
      }
      
      const navigationState = {
        courseName: presentation.courseName,
        theme: selectedTheme,
        presentationFile: `${presentation.courseName}_presentation.json`
      };
      
      console.log('[PresentationCanvas] Publishing presentation...', navigationState);
      
      const toastId = 'publishing-presentation';
      toast.loading("Publishing presentation...", { id: toastId });
      
      console.log('[PresentationCanvas] Attempting navigation to /published-presentation');
      
      navigate('/published-presentation', {
        state: navigationState
      });
      
      setTimeout(() => {
        toast.dismiss(toastId);
      }, 1000);
      
    } catch (error) {
      console.error('[PresentationCanvas] Error publishing presentation:', error);
      toast.dismiss('publishing-presentation');
      toast.error("Failed to publish presentation");
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50 transition-all duration-300">
        <div className="px-8 py-4 flex justify-between items-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard')} 
            className="cursor-pointer"
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent hover:from-purple-500 hover:via-pink-600 hover:to-purple-700 transition-all duration-300">
              AI-Buddy
            </h1>
          </motion.div>

          <div className="flex items-center space-x-6">
            <div className="relative w-96 group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-purple-400 transition-colors duration-200" />
              <Input 
                placeholder="Search in presentation..."
                className="pl-10 bg-gray-800/50 border-gray-700 text-white w-full focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="w-8 h-8 rounded-full bg-gray-800/50 text-gray-300 hover:text-white hover:bg-purple-500/20"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onMouseEnter={() => setShowHelpTooltip(true)}
                  onMouseLeave={() => setShowHelpTooltip(false)}
                  className="w-8 h-8 rounded-full bg-gray-800/50 text-gray-300 hover:text-white hover:bg-purple-500/20"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
                <AnimatePresence>
                  {showHelpTooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-64 p-4 bg-gray-800 rounded-lg shadow-xl border border-gray-700"
                    >
                      <h4 className="text-white font-medium mb-2">Keyboard Shortcuts</h4>
                      <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex justify-between">
                          <span>Next Slide</span>
                          <span className="text-gray-400">→ or Space</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Previous Slide</span>
                          <span className="text-gray-400">←</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Toggle Fullscreen</span>
                          <span className="text-gray-400">F</span>
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="relative group">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer ring-2 ring-purple-500/20 hover:ring-purple-500/40 transition-all duration-300"
              >
                <span className="text-white font-medium">V</span>
              </motion.div>
              
              <div className="absolute right-0 mt-2 w-48 py-2 bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button 
                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-purple-500/20 flex items-center transition-colors duration-200"
                  onClick={() => console.log('Settings clicked')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>
                <button 
                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-purple-500/20 flex items-center transition-colors duration-200"
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

      <div className={`container mx-auto px-6 py-8 pb-32 ${isFullscreen ? 'max-w-none' : ''}`}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-purple-400" />
            <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Presentation Canvas
            </span>
          </h2>
        </motion.div>

        <div className="relative min-h-[60vh] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`w-full ${isFullscreen ? 'max-w-6xl' : 'max-w-4xl'} bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-xl border border-gray-700/50 relative`}
            >
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {!isEditing ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEditClick}
                    className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSave}
                      className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCancel}
                      className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <>
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-3xl font-bold text-white mb-8 bg-gray-700/50 border-gray-600 focus:border-purple-500"
                  />
                  {currentSection.type === 'quiz' ? (
                    <div className="space-y-8">
                      {editedQuizQuestions.map((quiz, index) => (
                        <div key={index} className="bg-gray-700/30 rounded-lg p-6 space-y-4">
                          <div className="space-y-4">
                            <label className="block">
                              <span className="text-white mb-2 block">Question {index + 1}</span>
                              <Textarea
                                value={quiz.question}
                                onChange={(e) => {
                                  const newQuestions = [...editedQuizQuestions];
                                  newQuestions[index] = { ...quiz, question: e.target.value };
                                  setEditedQuizQuestions(newQuestions);
                                }}
                                className="w-full bg-gray-700/50 border-gray-600 text-white"
                              />
                            </label>
                            
                            <div className="space-y-2">
                              <span className="text-white block">Options</span>
                              {quiz.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const newQuestions = [...editedQuizQuestions];
                                      newQuestions[index].options[optionIndex] = e.target.value;
                                      setEditedQuizQuestions(newQuestions);
                                    }}
                                    className="flex-1 bg-gray-700/50 border-gray-600 text-white"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newQuestions = [...editedQuizQuestions];
                                      newQuestions[index].options = quiz.options.filter((_, i) => i !== optionIndex);
                                      setEditedQuizQuestions(newQuestions);
                                    }}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              {quiz.options.length < 4 && (
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    const newQuestions = [...editedQuizQuestions];
                                    newQuestions[index].options.push('');
                                    setEditedQuizQuestions(newQuestions);
                                  }}
                                  className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                                >
                                  Add Option
                                </Button>
                              )}
                            </div>

                            <label className="block">
                              <span className="text-white mb-2 block">Correct Answer</span>
                              <select
                                value={quiz.correct_answer}
                                onChange={(e) => {
                                  const newQuestions = [...editedQuizQuestions];
                                  newQuestions[index] = { ...quiz, correct_answer: e.target.value };
                                  setEditedQuizQuestions(newQuestions);
                                }}
                                className="w-full bg-gray-700/50 border-gray-600 text-white rounded-md p-2"
                              >
                                {quiz.options.map((option, i) => (
                                  <option key={i} value={option}>{option}</option>
                                ))}
                              </select>
                            </label>

                            <label className="block">
                              <span className="text-white mb-2 block">Explanation</span>
                              <Textarea
                                value={quiz.explanation}
                                onChange={(e) => {
                                  const newQuestions = [...editedQuizQuestions];
                                  newQuestions[index] = { ...quiz, explanation: e.target.value };
                                  setEditedQuizQuestions(newQuestions);
                                }}
                                className="w-full bg-gray-700/50 border-gray-600 text-white"
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditedQuizQuestions([...editedQuizQuestions, {
                            question: '',
                            options: [''],
                            correct_answer: '',
                            explanation: ''
                          }]);
                        }}
                        className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                      >
                        Add Question
                      </Button>
                    </div>
                  ) : (
                    <ul className="space-y-6">
                      {editedPoints?.map((point, index) => (
                        <motion.li
                          key={index}
                          className="flex items-start gap-4"
                        >
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-semibold">
                            {index + 1}
                          </span>
                          <Textarea
                            value={point}
                            onChange={(e) => {
                              const newPoints = [...editedPoints];
                              newPoints[index] = e.target.value;
                              setEditedPoints(newPoints);
                            }}
                            className="flex-1 text-lg text-gray-200 bg-gray-700/50 border-gray-600 focus:border-purple-500 min-h-[100px]"
                          />
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-white mb-8 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                    {currentSection.title}
                  </h2>
                  
                  {currentSection.type === 'welcome' && (
                    <div className="space-y-8">
                      <div className="flex justify-center mb-12">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      <ul className="space-y-6">
                        {currentSection.summary_points?.map((point, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-4 text-gray-200"
                          >
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-semibold">
                              {index + 1}
                            </span>
                            <span className="text-lg">{point}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentSection.type === 'overview' && currentSection.metadata && (
                    <div className="space-y-8">
                      <div className="bg-gray-700/30 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">Prerequisites</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-300">
                          {currentSection.metadata.prerequisites.map((prereq, index) => (
                            <li key={index}>{prereq}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-gray-700/30 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">Learning Goals</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-300">
                          {currentSection.metadata.learningGoals.map((goal, index) => (
                            <li key={index}>{goal}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-gray-700/30 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">Estimated Time</h3>
                        <p className="text-gray-300">{currentSection.metadata.estimatedTime}</p>
                      </div>
                    </div>
                  )}

                  {currentSection.type === 'section_header' && (
                    <div className="flex flex-col items-center justify-center h-[40vh]">
                      <h2 className="text-4xl font-bold text-white mb-4 text-center">
                        {currentSection.title}
                      </h2>
                      <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                    </div>
                  )}

                  {currentSection.type === 'section_metadata' && currentSection.metadata && (
                    <div className="space-y-8">
                      <div className="bg-gray-700/30 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">Prerequisites</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-300">
                          {currentSection.metadata.prerequisites.map((prereq, index) => (
                            <li key={index}>{prereq}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-gray-700/30 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">Learning Goals</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-300">
                          {currentSection.metadata.learningGoals.map((goal, index) => (
                            <li key={index}>{goal}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-gray-700/30 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">Estimated Time</h3>
                        <p className="text-gray-300">{currentSection.metadata.estimatedTime}</p>
                      </div>
                    </div>
                  )}

                  {currentSection.type === 'content' && (
                    <ul className="space-y-6">
                      {currentSection.summary_points?.map((point, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-4 text-gray-200"
                        >
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-semibold">
                            {index + 1}
                          </span>
                          <span className="text-lg">{point}</span>
                        </motion.li>
                      ))}
                    </ul>
                  )}

                  {currentSection.type === 'quiz' && currentSection.quiz_questions && (
                    <div className="space-y-8">
                      {currentSection.quiz_questions.map((quiz, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gray-700/30 rounded-lg p-6 space-y-4"
                        >
                          <h3 className="text-xl text-white font-medium flex items-start gap-3">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-semibold">
                              {index + 1}
                            </span>
                            {quiz.question}
                          </h3>
                          <ul className="space-y-3 ml-11">
                            {quiz.options.map((option, optionIndex) => (
                              <li
                                key={optionIndex}
                                className={`p-3 rounded-lg border ${
                                  option === quiz.correct_answer
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                    : 'border-gray-700 bg-gray-800/50 text-gray-300'
                                }`}
                              >
                                {option}
                              </li>
                            ))}
                          </ul>
                          <div className="ml-11 mt-4 text-gray-400 italic">
                            <span className="text-emerald-400 font-medium">Explanation: </span>
                            {quiz.explanation}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 bg-gray-800/90 backdrop-blur-lg rounded-full border border-purple-500/30 p-2 shadow-lg"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousSlide}
              disabled={currentSlide === 0}
              className="w-10 h-10 rounded-full text-gray-300 hover:text-white hover:bg-purple-500/20 disabled:opacity-50 transition-all duration-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <span className="text-gray-400 text-sm px-4 min-w-[4rem] text-center">
              {currentSlide + 1} / {presentation.sections.length}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextSlide}
              disabled={currentSlide === presentation.sections.length - 1}
              className="w-10 h-10 rounded-full text-gray-300 hover:text-white hover:bg-purple-500/20 disabled:opacity-50 transition-all duration-200"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group"
          >
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePublish}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-l-full font-medium shadow-lg transition-all duration-300 relative group transform hover:scale-105"
              >
                <div className="absolute inset-0 rounded-l-full bg-emerald-400/20 blur-md animate-pulse-slow" />
                <Share2 className="w-4 h-4" />
                <span>Publish Presentation</span>
                <div className="absolute inset-0 rounded-l-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 blur-md animate-pulse" />
              </Button>
              
              <div className="relative">
                <Button
                  onClick={() => setShowThemeSelector(!showThemeSelector)}
                  className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-r-full font-medium shadow-lg transition-all duration-300 border-l border-white/20"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showThemeSelector ? 'rotate-180' : ''}`} />
                </Button>
                
                {showThemeSelector && (
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50">
                    <div className="sticky top-0 p-3 border-b border-gray-700 bg-gray-800/95 backdrop-blur-sm">
                      <h3 className="text-sm font-medium text-gray-300">Select Theme</h3>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {themes.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => {
                            setSelectedTheme(theme.id);
                            setShowThemeSelector(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-700/50 transition-colors duration-200 flex flex-col gap-1 ${
                            selectedTheme === theme.id ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-300'
                          }`}
                        >
                          <div className="text-sm font-medium flex items-center justify-between">
                            {theme.name}
                            {selectedTheme === theme.id && (
                              <div className="text-emerald-400">
                                <Check className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{theme.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <label
                htmlFor="logo-upload"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg cursor-pointer transition-colors duration-200"
              >
                {logoPreview ? (
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span>Change Logo</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Upload Logo</span>
                  </div>
                )}
              </label>
              
              {logoPreview && (
                <div className="absolute top-full mt-2 p-2 bg-gray-800 rounded-lg shadow-xl">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="h-8 w-auto"
                  />
                  <button
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                      if (presentation) {
                        const updatedPresentation = {
                          ...presentation,
                          presentationConfig: {
                            ...presentation.presentationConfig,
                            logo: undefined
                          }
                        };
                        setPresentation(updatedPresentation);
                      }
                    }}
                    className="mt-2 text-xs text-red-400 hover:text-red-300"
                  >
                    Remove Logo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-900/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400 hover:text-gray-300 transition-colors duration-200">© 2025 AI-Buddy. All rights reserved.</span>
              <span className="text-gray-600">•</span>
              <span className="text-sm text-gray-400">Version 0.0.9</span>
            </div>
            <p className="text-sm text-gray-400 hover:text-gray-300 transition-colors duration-200">
              Created by Vijay Betigiri (vijay.betigiri@swisscom.com)
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
          }
          50% {
            box-shadow: 0 0 40px rgba(16, 185, 129, 0.6);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
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

        .slide-transition {
          transition: all 0.3s ease-in-out;
        }

        .hover-scale {
          transition: transform 0.2s ease-in-out;
        }

        .hover-scale:hover {
          transform: scale(1.05);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.7);
        }
      `}</style>
    </div>
  );
};

export default PresentationCanvas; 