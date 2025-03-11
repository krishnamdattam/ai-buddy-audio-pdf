import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ChevronRight, BookOpen, Languages, FileText, Upload, X, Globe, MessageSquare, MessageCircle, Clock, Target, BookOpenCheck, ChevronDown, XCircle, Wand2, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

// Add interface for document source
interface DocumentSource {
  type: 'pdf' | 'url';
  content: File[] | string;
}

// Add interface for skill level
interface SkillLevel {
  value: number;
  label: string;
  description: string;
  color: string;
}

// Add interface for course duration
interface DurationLevel {
  value: number;
  label: string;
  description: string;
  minutes: string;
  color: string;
}

// Add interface for focus area option
interface FocusAreaOption {
  id: string;
  label: string;
  category: 'focus' | 'avoid';
  isCustom?: boolean;
}

// Add interface for knowledge area option
interface KnowledgeAreaOption {
  id: string;
  label: string;
  category: 'technical' | 'soft-skills' | 'domain';
  isCustom?: boolean;
}

// Update language configuration with flag codes and native names
const languages = [
  { 
    id: 'english', 
    name: 'English', 
    nativeName: 'English',
    code: 'en',
    flag: '🇬🇧'
  },
  { 
    id: 'german', 
    name: 'German', 
    nativeName: 'Deutsch',
    code: 'de',
    flag: '🇩🇪'
  },
  { 
    id: 'french', 
    name: 'French', 
    nativeName: 'Français',
    code: 'fr',
    flag: '🇫🇷'
  },
  { 
    id: 'italian', 
    name: 'Italian', 
    nativeName: 'Italiano',
    code: 'it',
    flag: '🇮🇹'
  }
];

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

// Add duration levels
const durationLevels: DurationLevel[] = [
  {
    value: 0,
    label: 'Very Short',
    description: 'Quick overview or introduction',
    minutes: '2-5 min',
    color: '#10B981'
  },
  {
    value: 25,
    label: 'Short',
    description: 'Brief but comprehensive coverage',
    minutes: '5-10 min',
    color: '#3B82F6'
  },
  {
    value: 50,
    label: 'Medium',
    description: 'Detailed exploration of topic',
    minutes: '10-20 min',
    color: '#8B5CF6'
  },
  {
    value: 75,
    label: 'Long',
    description: 'In-depth coverage with examples',
    minutes: '20-30 min',
    color: '#EC4899'
  },
  {
    value: 100,
    label: 'Very Long',
    description: 'Comprehensive deep dive',
    minutes: '30-40 min',
    color: '#F43F5E'
  }
];

// Update course templates
const courseTemplates = [
  {
    id: 'project-onboarding',
    title: 'Project Onboarding',
    description: 'Comprehensive guide for new joiners to understand project details, architecture, and workflows',
    duration: '45-60 minutes',
    icon: 'BookOpen'
  },
  {
    id: 'technology-learning',
    title: 'Technology Learning',
    description: 'In-depth exploration of products, technologies, and technical concepts',
    duration: '30-45 minutes',
    icon: 'Code'
  },
  {
    id: 'wiki-process',
    title: 'Wiki & Process Guide',
    description: 'Step-by-step guides for internal processes, troubleshooting, and support procedures',
    duration: '15-25 minutes',
    icon: 'FileText'
  },
  {
    id: 'customer-education',
    title: 'Customer Education',
    description: 'Engaging content to help customers understand product features and get the most value',
    duration: '20-30 minutes',
    icon: 'Users'
  }
];

// Add focus area options
const focusAreaOptions: FocusAreaOption[] = [
  { id: 'real-world', label: 'Real-world applications', category: 'focus', isCustom: false },
  { id: 'hands-on', label: 'Hands-on exercises', category: 'focus', isCustom: false },
  { id: 'best-practices', label: 'Best practices & standards', category: 'focus', isCustom: false },
  { id: 'troubleshooting', label: 'Troubleshooting guides', category: 'focus', isCustom: false },
  { id: 'case-studies', label: 'Case studies', category: 'focus', isCustom: false },
  { id: 'avoid-theory', label: 'Complex theoretical concepts', category: 'avoid', isCustom: false },
  { id: 'avoid-legacy', label: 'Legacy approaches', category: 'avoid', isCustom: false },
  { id: 'avoid-advanced', label: 'Advanced edge cases', category: 'avoid', isCustom: false }
];

// Add knowledge area options
const knowledgeAreaOptions: KnowledgeAreaOption[] = [
  { id: 'programming', label: 'Basic programming concepts', category: 'technical', isCustom: false },
  { id: 'web-dev', label: 'Web development fundamentals', category: 'technical', isCustom: false },
  { id: 'databases', label: 'Database basics', category: 'technical', isCustom: false },
  { id: 'git', label: 'Version control (Git)', category: 'technical', isCustom: false },
  { id: 'agile', label: 'Agile methodologies', category: 'soft-skills', isCustom: false },
  { id: 'project-mgmt', label: 'Project management', category: 'soft-skills', isCustom: false },
  { id: 'domain-business', label: 'Business domain knowledge', category: 'domain', isCustom: false },
  { id: 'domain-industry', label: 'Industry standards', category: 'domain', isCustom: false }
];

const CourseGenerator = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('technology-learning');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('german');
  const [skillLevel, setSkillLevel] = useState<number>(0);
  const [duration, setDuration] = useState<number>(50); // Default to Medium
  const [focusAreas, setFocusAreas] = useState('');
  const [existingKnowledge, setExistingKnowledge] = useState('');
  const [documentSource, setDocumentSource] = useState<DocumentSource>({
    type: 'pdf',
    content: []
  });
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [documentSummary, setDocumentSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [speakerCount, setSpeakerCount] = useState<number>(2);

  // Helper function to get current skill level
  const getCurrentSkillLevel = (value: number): SkillLevel => {
    return skillLevels.reduce((prev, curr) => {
      return Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev;
    });
  };

  // Helper function to get current duration level
  const getCurrentDurationLevel = (value: number): DurationLevel => {
    return durationLevels.reduce((prev, curr) => {
      return Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev;
    });
  };

  // Handle template selection
  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
  };

  // Handle language selection
  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
  };

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setDocumentSource(prev => ({
        ...prev,
        content: filesArray
      }));
    }
  };

  // Handle file removal
  const removeFile = (fileToRemove: File) => {
    if (documentSource.type === 'pdf' && Array.isArray(documentSource.content)) {
      setDocumentSource(prev => ({
        ...prev,
        content: (prev.content as File[]).filter(file => file !== fileToRemove)
      }));
    }
  };

  // Handle course creation
  const handleCreateCourse = async () => {
    if (!courseName || !selectedTemplate || !selectedLanguage) {
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
      let endpoint = documentSource.type === 'pdf' ? 'process-pdf' : 'process-url';
      let requestData;

      if (documentSource.type === 'pdf') {
        const formData = new FormData();
        (documentSource.content as File[]).forEach(file => {
          formData.append('file', file);
        });
        formData.append('template', selectedTemplate);
        formData.append('language', selectedLanguage);
        formData.append('courseName', courseName);
        formData.append('skillLevel', skillLevel.toString());
        formData.append('duration', duration.toString());
        formData.append('focusAreas', focusAreas);
        formData.append('existingKnowledge', existingKnowledge);
        formData.append('documentSummary', documentSummary);
        formData.append('speakerCount', speakerCount.toString());
        requestData = formData;
      } else {
        requestData = JSON.stringify({
          url: documentSource.content,
          template: selectedTemplate,
          language: selectedLanguage,
          courseName: courseName,
          skillLevel: skillLevel,
          duration: duration,
          focusAreas: focusAreas,
          existingKnowledge: existingKnowledge,
          documentSummary: documentSummary,
          speakerCount: speakerCount,
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
      } else {
        throw new Error('Invalid response data');
      }

    } catch (error) {
      console.error('Error processing course:', error);
      toast.error('Failed to process course', {
        description: 'Please try again or contact support'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!documentSource.content) {
      toast.error('Please upload a document or provide a URL first');
      return;
    }
    
    setIsGeneratingSummary(true);
    try {
      // TODO: Implement actual API call to generate summary
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated delay
      setDocumentSummary('Auto-generated summary will appear here...');
      toast.success('Summary generated successfully');
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <Header showSearch={false} />

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Card className="bg-gray-800/50 border-gray-700 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600/30 via-pink-500/30 to-purple-600/30 rounded-lg blur-md animate-pulse" />
          <div className="relative bg-gray-800/90 rounded-lg p-6 sm:p-8">
            <CardHeader className="px-0 pt-0 pb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10 ring-1 ring-purple-500/20 shadow-lg shadow-purple-500/10">
                  <PlusCircle className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Create New Course</CardTitle>
                  <p className="text-gray-400 mt-2 text-base sm:text-lg">Transform your documents into interactive learning experiences</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-12 px-0">
              {/* Course Name */}
              <div className="space-y-3">
                <label className="text-base font-medium text-gray-200 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-400" />
                  Course Name
                </label>
                <div className="space-y-2">
                  <Input
                    placeholder="e.g., Introduction to Cloud Computing"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 h-14 text-lg px-4 transition-colors duration-200 focus:border-purple-500/50 focus:ring-purple-500/20"
                  />
                  <p className="text-sm text-gray-400 leading-relaxed">
                    A good course name includes: topic focus, target audience, and version (e.g., "Python for Beginners 1.0", "Advanced React Patterns 2023", "DevOps Fundamentals: CI/CD Pipeline")
                  </p>
                </div>
              </div>

              {/* Course Template and Language Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Course Template */}
                <div className="space-y-3">
                  <label className="text-base font-medium text-gray-200 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-purple-400" />
                    Course Template
                  </label>
                  <Select onValueChange={handleTemplateChange} value={selectedTemplate}>
                    <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white h-[70px] items-start pt-2 px-4 text-base transition-colors duration-200 hover:bg-gray-700/70 focus:border-purple-500/50 focus:ring-purple-500/20">
                      <SelectValue>
                        {selectedTemplate ? (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-purple-400" />
                            <span className="text-base font-medium">
                              {courseTemplates.find(template => template.id === selectedTemplate)?.title}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-base">Choose a template</p>
                            <p className="text-sm text-gray-400">Select a predefined structure for your learning content</p>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800/95 border-gray-700 text-white backdrop-blur-lg">
                      {courseTemplates.map(template => (
                        <SelectItem 
                          key={template.id} 
                          value={template.id} 
                          className="text-white hover:bg-gray-700/50 focus:bg-gray-700/50 transition-colors duration-200"
                        >
                          <div className="py-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              <MessageSquare className="h-4 w-4 text-purple-400" />
                              <span className="text-base font-medium text-white">{template.title}</span>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed mb-2">{template.description}</p>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-purple-400/70" />
                              <span className="text-xs text-gray-400">{template.duration}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Language Selection */}
                <div className="space-y-3">
                  <label className="text-base font-medium text-gray-200 flex items-center gap-2">
                    <Languages className="h-5 w-5 text-purple-400" />
                    Language
                  </label>
                  <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white h-[70px] items-start pt-2 px-4 text-base transition-colors duration-200 hover:bg-gray-700/70 focus:border-purple-500/50 focus:ring-purple-500/20">
                      <SelectValue>
                        {selectedLanguage ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xl leading-none">
                              {languages.find(lang => lang.id === selectedLanguage)?.flag}
                            </span>
                            <span className="text-base font-medium">
                              {languages.find(lang => lang.id === selectedLanguage)?.name}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-base">Choose a language</p>
                            <p className="text-sm text-gray-400">Select the primary language for content and narration</p>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800/95 border-gray-700 text-white backdrop-blur-lg">
                      {languages.map(lang => (
                        <SelectItem 
                          key={lang.id} 
                          value={lang.id} 
                          className="text-white hover:bg-gray-700/50 focus:bg-gray-700/50 transition-colors duration-200"
                        >
                          <div className="py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xl leading-none">{lang.flag}</span>
                              <div className="flex flex-col gap-1">
                                <span className="text-base font-medium">{lang.name}</span>
                                <span className="text-sm text-gray-400">{lang.nativeName}</span>
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Settings Section */}
              <Collapsible
                open={isAdvancedOpen}
                onOpenChange={setIsAdvancedOpen}
                className="space-y-6"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between p-5 rounded-xl bg-gray-900/50 hover:bg-gray-900/70 transition-all duration-200 ring-1 ring-gray-700/50 hover:ring-purple-500/30 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base font-medium text-gray-200 group-hover:text-purple-400 transition-colors">Advanced Settings</span>
                      <span className="text-sm text-gray-500 font-medium">(Optional)</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-gray-400 transition-transform duration-300 group-hover:text-purple-400",
                        isAdvancedOpen ? "transform rotate-180" : ""
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-8 animate-slideDown">
                  {/* Document Summary */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-base font-medium text-gray-200 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-400" />
                        Document Summary
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateSummary}
                        disabled={isGeneratingSummary || !documentSource.content}
                        className="flex items-center gap-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                      >
                        <Wand2 className={cn(
                          "h-4 w-4",
                          isGeneratingSummary && "animate-spin"
                        )} />
                        Auto-generate
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Provide a brief summary of the document content..."
                        value={documentSummary}
                        onChange={(e) => setDocumentSummary(e.target.value)}
                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-[120px] text-base px-4 transition-colors duration-200 focus:border-purple-500/50 focus:ring-purple-500/20"
                      />
                      <p className="text-sm text-gray-400">
                        Add a concise overview of the document's main points and key takeaways
                      </p>
                    </div>
                  </div>

                  {/* Speaker Count */}
                  <div className="space-y-2">
                    <label className="text-base font-medium text-gray-200 flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-400" />
                      Number of Speakers
                    </label>
                    <div className="flex gap-3">
                      {[1, 2, 3].map((count) => (
                        <Button
                          key={count}
                          variant="ghost"
                          onClick={() => setSpeakerCount(count)}
                          className={cn(
                            "flex-1 py-2 px-4 rounded-lg transition-all duration-200",
                            speakerCount === count
                              ? "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/50"
                              : "bg-gray-700/50 text-gray-400 hover:bg-gray-700/70"
                          )}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="relative flex items-center">
                              {Array.from({ length: count }).map((_, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "w-5 h-5 rounded-full ring-2 ring-gray-800 flex items-center justify-center",
                                    i > 0 && "-ml-2",
                                    speakerCount === count ? "bg-purple-400/20" : "bg-gray-600/20"
                                  )}
                                >
                                  <Users className={cn(
                                    "h-3 w-3",
                                    speakerCount === count ? "text-purple-400" : "text-gray-400"
                                  )} />
                                </div>
                              ))}
                            </div>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-400">Select the number of speakers for course narration</p>
                  </div>

                  {/* Focus Areas and Existing Knowledge */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Focus Areas */}
                    <div className="space-y-3">
                      <label className="text-base font-medium text-gray-200 flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-400" />
                        Focus Areas
                      </label>
                      <div>
                        <Textarea
                          placeholder="Specify key topics and concepts to focus on, and any areas to avoid"
                          value={focusAreas}
                          onChange={(e) => setFocusAreas(e.target.value)}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-[120px] text-base px-4 transition-colors duration-200 focus:border-purple-500/50 focus:ring-purple-500/20"
                        />
                      </div>
                    </div>

                    {/* Existing Knowledge */}
                    <div className="space-y-3">
                      <label className="text-base font-medium text-gray-200 flex items-center gap-2">
                        <BookOpenCheck className="h-5 w-5 text-purple-400" />
                        Learner's Existing Knowledge
                      </label>
                      <div>
                        <Textarea
                          placeholder="List existing relavant domain knowledge,technical skills existing with the learner"
                          value={existingKnowledge}
                          onChange={(e) => setExistingKnowledge(e.target.value)}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-[120px] text-base px-4 transition-colors duration-200 focus:border-purple-500/50 focus:ring-purple-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Skill Level and Duration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Skill Level Box */}
                    <div className="p-6 rounded-xl bg-gray-900/50 ring-1 ring-gray-700/50 hover:ring-purple-500/30 transition-all duration-200">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-lg font-medium text-white mb-1">
                            {getCurrentSkillLevel(skillLevel).label}
                          </h4>
                          <p className="text-gray-400 text-base">
                            {getCurrentSkillLevel(skillLevel).description}
                          </p>
                        </div>
                        <span className="text-gray-400 font-medium">{skillLevel}%</span>
                      </div>

                      <div className="relative">
                        <div className="h-[2px] bg-gray-800">
                          <div 
                            className="h-full transition-all duration-300"
                            style={{
                              background: `linear-gradient(to right, #10B981, #3B82F6, #A855F7, #EC4899)`,
                              width: `${skillLevel}%`
                            }}
                          />
                        </div>

                        <div className="absolute -top-1 left-0 right-0 flex justify-between">
                          {skillLevels.map((level) => (
                            <div
                              key={level.value}
                              className={cn(
                                "w-2 h-2 rounded-full transition-all duration-300",
                                skillLevel >= level.value ? "opacity-100 scale-110" : "opacity-30 scale-100"
                              )}
                              style={{ backgroundColor: level.color }}
                            />
                          ))}
                        </div>

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

                        <div 
                          className="absolute -top-1 w-2 h-2 rounded-full bg-white border-2 border-blue-500 transition-all duration-300 pointer-events-none shadow-lg shadow-blue-500/50"
                          style={{ 
                            left: `calc(${skillLevel}% - 4px)`,
                            display: skillLevel > 0 ? 'block' : 'none'
                          }}
                        />
                      </div>
                    </div>

                    {/* Duration Box */}
                    <div className="p-6 rounded-xl bg-gray-900/50 ring-1 ring-gray-700/50 hover:ring-purple-500/30 transition-all duration-200">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-lg font-medium text-white mb-1">
                            {getCurrentDurationLevel(duration).label}
                          </h4>
                          <p className="text-gray-400 text-base">
                            {getCurrentDurationLevel(duration).description}
                          </p>
                        </div>
                        <span className="text-gray-400 font-medium">{getCurrentDurationLevel(duration).minutes}</span>
                      </div>

                      <div className="relative">
                        <div className="h-[2px] bg-gray-800">
                          <div 
                            className="h-full transition-all duration-300"
                            style={{
                              background: `linear-gradient(to right, #10B981, #3B82F6, #8B5CF6, #EC4899, #F43F5E)`,
                              width: `${duration}%`
                            }}
                          />
                        </div>

                        <div className="absolute -top-1 left-0 right-0 flex justify-between">
                          {durationLevels.map((level) => (
                            <div
                              key={level.value}
                              className={cn(
                                "w-2 h-2 rounded-full transition-all duration-300",
                                duration >= level.value ? "opacity-100 scale-110" : "opacity-30 scale-100"
                              )}
                              style={{ backgroundColor: level.color }}
                            />
                          ))}
                        </div>

                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="25"
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="absolute -top-1 left-0 w-full h-4 opacity-0 cursor-pointer"
                          style={{
                            WebkitAppearance: 'none',
                            background: 'transparent'
                          }}
                        />

                        <div 
                          className="absolute -top-1 w-2 h-2 rounded-full bg-white border-2 border-blue-500 transition-all duration-300 pointer-events-none shadow-lg shadow-blue-500/50"
                          style={{ 
                            left: `calc(${duration}% - 4px)`,
                            display: duration > 0 ? 'block' : 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Document Source */}
              <div className="p-6 rounded-xl border-2 border-dashed border-gray-700 transition-all duration-300 hover:bg-gray-800/50 hover:border-purple-500/30 group">
                <div className="flex gap-4 mb-6">
                  <Button
                    variant="ghost"
                    onClick={() => setDocumentSource(prev => ({ ...prev, type: 'pdf' }))}
                    className={cn(
                      "flex-1 h-14 text-base font-medium rounded-xl transition-all duration-200",
                      documentSource.type === 'pdf' 
                        ? "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/50 shadow-lg shadow-purple-500/10" 
                        : "bg-gray-700/50 text-gray-400 ring-1 ring-gray-700 hover:bg-gray-700/70"
                    )}
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    PDF Document
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setDocumentSource(prev => ({ ...prev, type: 'url' }))}
                    className={cn(
                      "flex-1 h-14 text-base font-medium rounded-xl transition-all duration-200",
                      documentSource.type === 'url' 
                        ? "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/50 shadow-lg shadow-purple-500/10" 
                        : "bg-gray-700/50 text-gray-400 ring-1 ring-gray-700 hover:bg-gray-700/70"
                    )}
                  >
                    <Globe className="h-5 w-5 mr-2" />
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
                      className="cursor-pointer flex items-center gap-5 group/upload"
                    >
                      <div className="p-3 rounded-xl bg-purple-500/10 ring-1 ring-purple-500/20 group-hover/upload:bg-purple-500/20 transition-colors duration-200">
                        <Upload className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-white mb-1">Upload PDF</h4>
                        <p className="text-gray-400 text-base">Upload your existing PDF documents</p>
                        <p className="text-gray-500 text-sm mt-2">PDF files only • Max 50MB</p>
                      </div>
                    </label>

                    {Array.isArray(documentSource.content) && documentSource.content.length > 0 && (
                      <div className="mt-6 space-y-3">
                        {documentSource.content.map((file: File, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3 group/file ring-1 ring-gray-700 hover:ring-purple-500/30 transition-all duration-200"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className="h-5 w-5 text-purple-400 shrink-0" />
                              <span className="text-base text-gray-200 truncate font-medium">{file.name}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                removeFile(file);
                              }}
                              className="opacity-0 group-hover/file:opacity-100 p-2 hover:text-red-400 transition-all duration-200 rounded-lg hover:bg-gray-700/50"
                            >
                              <X className="h-5 w-5" />
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
                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 h-14 text-base px-4 transition-colors duration-200 focus:border-purple-500/50 focus:ring-purple-500/20"
                      />
                      <p className="text-gray-500 text-sm mt-3">Make sure the URL is publicly accessible</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
                <Button
                  onClick={handleCreateCourse}
                  disabled={!courseName || !selectedTemplate || !selectedLanguage || !documentSource.content}
                  className={cn(
                    "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 h-14 text-base font-medium rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/20",
                    "disabled:from-gray-700 disabled:to-gray-700 disabled:opacity-50 disabled:shadow-none"
                  )}
                >
                  Create Course
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {isLoading && <LoadingSpinner />}
      
      <Footer />
    </div>
  );
};

export default CourseGenerator; 