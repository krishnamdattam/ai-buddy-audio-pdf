import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, ChevronRight, BookOpen, Clock, Settings, LogOut, Search, Plus, Users, FileText, Upload, Play } from 'lucide-react';
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

// First, create an interface for the template structure
interface CourseTemplate {
  id: string;
  title: string;
  description: string;
  duration: string;
  language: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
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

  // Add this to your component's constants
  const courseTemplates: CourseTemplate[] = [
    {
      id: 'educational-deep-dive',
      title: 'Educational Deep Dive',
      description: 'In-depth exploration of complex topics',
      duration: '30-45 minutes',
      language: 'English'
    },
    {
      id: 'quick-industry-update',
      title: 'Quick Industry Update',
      description: 'Concise overview of latest developments',
      duration: '15-20 minutes',
      language: 'English'
    },
    {
      id: 'engaging-podcast',
      title: 'Engaging Podcast',
      description: 'Share expert insights and explain concepts',
      duration: '20-30 minutes',
      language: 'English'
    },
    {
      id: 'rapid-refresher',
      title: 'Rapid Refresher',
      description: 'Quick memory refresh of essential concepts',
      duration: '10-15 minutes',
      language: 'German'
    },
    {
      id: 'executive-summary',
      title: 'Executive Summary',
      description: 'Strategic overview for high-level decision making',
      duration: '15-20 minutes',
      language: 'French'
    }
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/signin');
      }
    };

    checkAuth();
  }, [navigate]);

  // Update the courses data structure to include progress and lastAccessed
  const courses = [
    {
      id: 1,
      title: 'Introduction to AI',
      createdAt: '2024-03-15',
      progress: 65, // percentage completed
      lastAccessed: '27.03.2024', // Added lastAccessed
    },
    {
      id: 2,
      title: 'Machine Learning Basics',
      createdAt: '2024-03-14',
      progress: 30,
      lastAccessed: '12.03.2024', // Added lastAccessed
    },
    {
      id: 3,
      title: 'Assets and Configuration Management',
      createdAt: '2024-03-20',
      progress: 0,
      lastAccessed: '20.03.2024',
    },
  ];

  const handleNext = async () => {
    if (courseName && selectedTemplate && selectedPersona && selectedFiles.length > 0) {
      setIsLoading(true);
      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', selectedFiles[0]);
        formData.append('template', selectedTemplate);
        formData.append('persona', selectedPersona);

        // Call the backend API
        const response = await fetch('http://localhost:5001/process-pdf', {
          method: 'POST',
          body: formData,
        });

        const rawData = await response.json();
        
        // Validate API response
        const result = APIResponseValidator.safeParse(rawData);
        
        if (!result.success) {
          console.error('API Response validation failed:', result.error);
          // Use default sections if API validation fails
          navigate('/course-canvas', { 
            state: {
              courseName,
              template: selectedTemplate,
              persona: selectedPersona,
              files: selectedFiles.map(file => file.name),
              processedSections: defaultSections
            },
            replace: true
          });
          return;
        }

        const validatedData = result.data;

        // Navigate with validated data
        navigate('/course-canvas', { 
          state: {
            courseName,
            template: selectedTemplate,
            persona: selectedPersona,
            files: selectedFiles.map(file => file.name),
            processedSections: validatedData.sections
          },
          replace: true
        });

      } catch (error) {
        console.error('API call failed:', error);
        toast("Failed to process course", {
          description: "Using default template as fallback",
          duration: 3000
        });
        
        // Navigate with default sections on error
        navigate('/course-canvas', { 
          state: {
            courseName,
            template: selectedTemplate,
            persona: selectedPersona,
            files: selectedFiles.map(file => file.name),
            processedSections: defaultSections
          },
          replace: true
        });
      } finally {
        setIsLoading(false);
      }
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

  const handlePersonaChange = (value: string) => {
    if (value === 'create-new') {
      setIsPersonaModalOpen(true);
    } else {
      setSelectedPersona(value);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  const removeFile = (fileToRemove: File) => {
    setSelectedFiles(selectedFiles.filter(file => file !== fileToRemove));
  };

  // Add these state variables at the top of your Dashboard component
  const [testQuestion, setTestQuestion] = useState('');
  const [testAnswer, setTestAnswer] = useState('');
  const [testFile, setTestFile] = useState<File | null>(null);
  const [testSections, setTestSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Add these functions inside your Dashboard component
  const handleTestApi = async () => {
    if (!testQuestion.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5001/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: testQuestion }),
      });

      const data = await response.json();
      if (data.error) {
        setTestAnswer(`Error: ${data.error}`);
      } else {
        setTestAnswer(data.answer);
      }
    } catch (error) {
      setTestAnswer(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!testFile) return;

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', testFile);

      const response = await fetch('http://localhost:5001/process-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.error) {
        setTestSections([{ title: 'Error', content: data.error }]);
      } else {
        setTestSections(data.sections);
      }
    } catch (error) {
      setTestSections([{ title: 'Error', content: error.message }]);
    } finally {
      setUploadLoading(false);
    }
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
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
                  <BookOpen className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">Total Courses</p>
                  <h3 className="text-3xl font-bold text-white mt-1">12</h3>
                  <p className="text-xs text-green-400 mt-1">↑ 23% from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">Learning Hours</p>
                  <h3 className="text-3xl font-bold text-white mt-1">48.5</h3>
                  <p className="text-xs text-green-400 mt-1">↑ 12% from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20">
                  <div className="h-6 w-6 text-emerald-400 flex items-center justify-center font-bold">
                    %
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">Avg. Completion</p>
                  <h3 className="text-3xl font-bold text-white mt-1">78%</h3>
                  <p className="text-xs text-green-400 mt-1">↑ 8% from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create New Course Button */}
        {!isExpanded && (
          <Button
            className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
                       text-white px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300
                       flex items-center space-x-3 mb-12 relative overflow-hidden"
            onClick={() => setIsExpanded(true)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-xl group-hover:opacity-75 transition-opacity" />
            <div className="relative flex items-center space-x-3">
              <div className="bg-white/10 rounded-full p-2">
                <PlusCircle className="h-5 w-5" />
              </div>
              <span className="text-lg">Create a New Personalised Course</span>
            </div>
          </Button>
        )}

        {/* Create Course Form */}
        {isExpanded && (
          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="text-2xl font-semibold text-white">Create New Course</CardTitle>
              <p className="text-sm text-gray-400 mt-1">Fill in the details below to create your personalized course</p>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              {/* Course Name with Icon */}
              <div className="space-y-2">
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
                      <Settings className="h-4 w-4 text-purple-400" />
                      Course Template
                    </label>
                    <Select onValueChange={handleTemplateChange}>
                      <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white h-[80px] items-start pt-3">
                        <SelectValue placeholder="Choose how you want to structure your course" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="educational-deep-dive" className="text-white hover:bg-gray-700">
                          <div className="py-2 space-y-1">
                            <div className="font-medium flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-purple-400" />
                              Educational Deep Dive
                            </div>
                            <div className="text-sm text-gray-400">In-depth exploration of complex topics</div>
                            <div className="text-xs text-purple-400/80">30-45 minutes • English</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="quick-industry-update" className="text-white hover:bg-gray-700">
                          <div className="py-2 space-y-1">
                            <div className="font-medium flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-purple-400" />
                              Quick Industry Update
                            </div>
                            <div className="text-sm text-gray-400">Concise overview of latest developments</div>
                            <div className="text-xs text-purple-400/80">15-20 minutes • English</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="engaging-podcast" className="text-white hover:bg-gray-700">
                          <div className="py-2 space-y-1">
                            <div className="font-medium flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-purple-400" />
                              Engaging Podcast
                            </div>
                            <div className="text-sm text-gray-400">Share expert insights and explain concepts</div>
                            <div className="text-xs text-purple-400/80">20-30 minutes • English</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="rapid-refresher" className="text-white hover:bg-gray-700 border-t border-gray-700">
                          <div className="py-2 space-y-1">
                            <div className="font-medium flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-purple-400" />
                              Rapid Refresher
                            </div>
                            <div className="text-sm text-gray-400">Quick memory refresh of essential concepts</div>
                            <div className="text-xs text-purple-400/80">5-10 minutes • German</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="executive-summary" className="text-white hover:bg-gray-700">
                          <div className="py-2 space-y-1">
                            <div className="font-medium flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-purple-400" />
                              Executive Summary
                            </div>
                            <div className="text-sm text-gray-400">Strategic overview for high-level decision making</div>
                            <div className="text-xs text-purple-400/80">10-15 minutes • French</div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Teaching Persona */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-400" />
                      Teaching Persona
                    </label>
                    <Select onValueChange={handlePersonaChange}>
                      <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white h-[80px] items-start pt-3">
                        <SelectValue placeholder="Choose your teaching style and approach" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="andy-julia" className="text-white hover:bg-gray-700">
                          <div className="py-2 space-y-1">
                            <div className="font-medium flex items-center gap-2">
                              <Users className="h-4 w-4 text-purple-400" />
                              Andy and Julia
                            </div>
                            <div className="text-sm text-gray-400">Friendly and engaging teaching duo</div>
                            <div className="text-xs text-purple-400/80">English • Conversational Style</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="robert-mark" className="text-white hover:bg-gray-700">
                          <div className="py-2 space-y-1">
                            <div className="font-medium flex items-center gap-2">
                              <Users className="h-4 w-4 text-purple-400" />
                              Robert and Mark
                            </div>
                            <div className="text-sm text-gray-400">Professional and technical experts</div>
                            <div className="text-xs text-purple-400/80">English • Technical Style</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="create-new" className="text-emerald-400 hover:bg-gray-700 border-t border-gray-700">
                          <div className="py-2 flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Create Custom Persona
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* PDF Upload Section - Only show if template and persona are selected */}
              {courseName.trim() !== '' && selectedTemplate && selectedPersona && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-400" />
                      Course Materials
                    </label>
                    <span className="text-xs text-gray-400">PDF files only • Max 50MB</span>
                  </div>
                  
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 hover:border-purple-500 transition-colors bg-gray-800/30">
                    <div className="flex flex-col items-center justify-center space-y-4">
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
                        className="cursor-pointer flex flex-col items-center justify-center group"
                      >
                        <div className="p-4 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                          <Upload className="h-6 w-6 text-purple-400" />
                        </div>
                        <span className="mt-4 text-sm font-medium text-gray-300">
                          Drag & drop your PDFs here or click to browse
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          Supported formats: PDF
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Selected Files List */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-3 mt-4">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-700/30 rounded-lg p-4 group hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                              <FileText className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{file.name}</p>
                              <p className="text-xs text-gray-400">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setIsExpanded(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!courseName || !selectedTemplate || !selectedPersona || selectedFiles.length === 0}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8"
                >
                  Create Course
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Courses */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-white">Your Personalised Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="group bg-gray-800/50 border-gray-700 hover:border-purple-500 hover:bg-gray-800/70 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-white flex items-center justify-between">
                    <span>{course.title}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => {
                          navigate('/index', {
                            state: {
                              courseName: course.title,
                              sections: [
                                // Define sections if needed
                              ],
                            },
                            replace: true,
                          });
                        }}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Created on {new Date(course.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }).replace(/\//g, '.')}</span>
                      <span>Last accessed {course.lastAccessed}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-purple-400 border-purple-400 hover:bg-purple-400/10"
                        onClick={() => console.log('Edit course', course.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-400 border-red-400 hover:bg-red-400/10"
                        onClick={() => console.log('Delete course', course.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Add ChatBot at the end of the main div */}
      <ChatBot />

      {/* Update the footer section */}
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

      {/* API Test Section */}
      <div className="max-w-7xl mx-auto px-8 py-4 mb-8">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
              <div className="p-2 rounded-full bg-yellow-500/10">
                <Settings className="h-4 w-4 text-yellow-400" />
              </div>
              API Test Section
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Question/Answer Test */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300">Test Question/Answer</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Test Question</label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter your test question..."
                      value={testQuestion}
                      onChange={(e) => setTestQuestion(e.target.value)}
                      className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                    />
                    <Button
                      onClick={handleTestApi}
                      disabled={isLoading || !testQuestion.trim()}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black min-w-[100px]"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          Testing
                        </div>
                      ) : (
                        'Test API'
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">API Response</label>
                  <Textarea
                    value={testAnswer}
                    readOnly
                    className="bg-gray-700/50 border-gray-600 text-white h-[104px] resize-none"
                    placeholder="API response will appear here..."
                  />
                </div>
              </div>
            </div>

            {/* PDF Upload Test */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300">Test PDF Processing</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setTestFile(e.target.files?.[0] || null)}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                  <Button
                    onClick={handleFileUpload}
                    disabled={uploadLoading || !testFile}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black min-w-[100px]"
                  >
                    {uploadLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Processing
                      </div>
                    ) : (
                      'Process PDF'
                    )}
                  </Button>
                </div>

                {/* Display Processed Sections */}
                {testSections.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-300">Processed Sections:</h4>
                    <div className="space-y-4">
                      {testSections.map((section, index) => (
                        <Card key={index} className="bg-gray-700/30 border-gray-600">
                          <CardHeader>
                            <CardTitle className="text-sm text-white">{section.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="text-sm text-gray-300">
                                <h5 className="font-medium mb-1">Content:</h5>
                                <p className="whitespace-pre-wrap">{section.content}</p>
                              </div>
                              {section.script && (
                                <div className="text-sm text-gray-300">
                                  <h5 className="font-medium mb-1">Generated Script:</h5>
                                  <p className="whitespace-pre-wrap">{section.script}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && <LoadingSpinner message="Processing your PDF..." />}
    </div>
  );
};

export default Dashboard;