import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface LearningGoal {
  topic: string;
  priorKnowledge: string;
  targetLevel: string;
  timeframe: string;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sectionInfo?: string;
}

interface ChatBotProps {
  courseName?: string;
  mode?: 'course' | 'recommendation';
}

const ChatBot = ({ courseName, mode = 'course' }: ChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: mode === 'course' 
        ? "👋 I'm your buddy!\n\nAsk me any questions about the course\nType 'feedback' to share your thoughts"
        : "👋, I can recommend learning paths based on your current skills and timeframe.\nWhat would you like to learn?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isFeedbackMode, setIsFeedbackMode] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackStep, setFeedbackStep] = useState<'initial' | 'rating' | 'comment'>('initial');
  const [learningGoal, setLearningGoal] = useState<LearningGoal | null>(null);
  const [conversationStep, setConversationStep] = useState<'initial' | 'topic' | 'knowledge' | 'goal' | 'complete'>('initial');
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleLearningPathFlow = async (userInput: string) => {
    let nextStep = conversationStep;
    let botResponse = '';

    // Immediately add user message to chat
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      text: userInput,
      sender: 'user',
      timestamp: new Date()
    }]);
    
    // Clear input field immediately
    setNewMessage('');
    
    // Set loading state
    setIsLoading(true);

    switch (conversationStep) {
      case 'initial':
        setLearningGoal({ topic: '', priorKnowledge: '', targetLevel: '', timeframe: '' });
        botResponse = "What would you like to learn? Please be specific!";
        nextStep = 'topic';
        break;

      case 'topic':
        setLearningGoal(prev => ({ ...prev!, topic: userInput }));
        botResponse = "Great! What's your current knowledge level? Please mention any related technologies or concepts you're familiar with.";
        nextStep = 'knowledge';
        break;

      case 'knowledge':
        setLearningGoal(prev => ({ ...prev!, priorKnowledge: userInput }));
        botResponse = "What's your learning goal and preferred timeframe? (e.g., 'Become an expert in 3 months', 'Build a production-ready application in 6 weeks')";
        nextStep = 'goal';
        break;

      case 'goal':
        const [targetLevel, timeframe] = parseGoalAndTimeframe(userInput);
        setLearningGoal(prev => ({ 
          ...prev!, 
          targetLevel: targetLevel,
          timeframe: timeframe
        }));
        
        try {
          const response = await fetch('http://localhost:5001/api/learning-path', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              topic: learningGoal?.topic,
              priorKnowledge: learningGoal?.priorKnowledge,
              targetLevel: targetLevel,
              timeframe: timeframe,
              availableCourses: await fetchAvailableCourses()
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate learning path');
          }

          const data = await response.json();
          // If user responds to course suggestions
          if (data.existingCourses && userInput.toLowerCase().includes('personalized')) {
            // Make another API call for personalized path
            const requestBody = {
              topic: learningGoal?.topic,
              priorKnowledge: learningGoal?.priorKnowledge,
              targetLevel: targetLevel,
              timeframe: timeframe,
              availableCourses: await fetchAvailableCourses(),
              generatePersonalized: true
            };

            const personalizedResponse = await fetch('http://localhost:5001/api/learning-path', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });
            
            if (!personalizedResponse.ok) {
              throw new Error('Failed to generate personalized learning path');
            }

            const personalizedData = await personalizedResponse.json();
            botResponse = formatLearningPath(personalizedData.learningPath);
          } else {
            botResponse = formatLearningPath(data.learningPath);
          }
        } catch (error) {
          console.error('Error generating learning path:', error);
          botResponse = "I apologize, but I encountered an error generating your learning path. Please try again.";
        }
        nextStep = 'complete';
        break;

      case 'complete':
        // Reset the conversation if user wants to start over
        if (userInput.toLowerCase().includes('start') || userInput.toLowerCase().includes('new')) {
          nextStep = 'initial';
          botResponse = "Let's start over. What would you like to learn?";
        } else {
          botResponse = "Would you like to start a new learning path? Just say 'start new' or ask me specific questions about the recommended courses.";
        }
        break;
    }

    // Add bot response to chat
    setMessages(prev => [
      ...prev,
      {
        id: prev.length + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      }
    ]);

    setConversationStep(nextStep);
    setIsLoading(false);
  };

  // Helper function to parse goal and timeframe from user input
  const parseGoalAndTimeframe = (input: string): [string, string] => {
    const timeframeRegex = /(\d+)\s*(month|week|day|year)s?/i;
    const match = input.match(timeframeRegex);
    
    const timeframe = match ? `${match[1]} ${match[2]}s` : '3 months';
    const targetLevel = input.toLowerCase().includes('expert') ? 'expert' :
                       input.toLowerCase().includes('intermediate') ? 'intermediate' : 'beginner';
    
    return [targetLevel, timeframe];
  };

  // Helper function to fetch available courses
  const fetchAvailableCourses = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      return await response.json();
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  };

  // Helper function to format learning path
  const formatLearningPath = (learningPath: any): string => {
    // For NND project handbook specific recommendations
    if (learningGoal?.topic.toLowerCase().includes('nnd') || 
        learningGoal?.topic.toLowerCase().includes('project handbook')) {
      
      const language = learningGoal?.priorKnowledge.toLowerCase().includes('german') ? 'german' : 'english';
      
      return `Based on your timeframe and learning goals, here's your recommended learning path for the NND Project Handbook:

      Step 1: Quick Overview (5 minutes)
      Start with "Projekthandbuch_Short_DE" - This provides a brief summary of all key topics and concepts in ${language}. This will give you a good foundation in just 5 minutes.

      Step 2: Comprehensive Deep-Dive (60 minutes)
      Then proceed to "${language === 'german' ? 'Projekthandbuch_DE' : 'Projekthandbuch_EN'}" - This comprehensive guide covers all topics in detail and will take about an hour to complete.

      Total Duration: ~65 minutes

      Would you like to:
      1. Start with the quick overview course
      2. Jump directly to the comprehensive guide
      3. Learn more about either course`;
    }

    // For other courses, keep existing logic
    if (learningPath.matchingCourses && learningPath.matchingCourses.length > 0) {
      return `I found existing AI-Buddy courses that match your interest in ${learningGoal?.topic}:

      ${learningPath.matchingCourses.map((course: any, index: number) => 
        `${index + 1}. ${course.title}
           ${course.summary}`
      ).join('\n\n')}

      Would you like to:
      1. Start one of these existing courses
      2. Generate a personalized learning path instead
      3. Learn more about a specific course

      Please choose an option or ask me about any of these courses.`;
    }

    // Calculate total duration from steps
    const totalWeeks = learningPath.steps.reduce((acc: number, step: any) => {
      const duration = step.duration.toLowerCase();
      const weeks = parseInt(duration);
      return acc + weeks;
    }, 0);

    return `Here's your personalized learning path:

    ${learningPath.skipRecommendations ? 
      `Based on your experience with ${learningPath.skipRecommendations.join(', ')}, we've customized this path.\n\n` : ''}

    ${learningPath.steps.map((step: any, index: number) => 
      `${index + 1}. ${step.title} (${step.source}, ${step.duration})
         ${step.description}
        ${step.prerequisites ? `\n         Prerequisites: ${step.prerequisites.join(', ')}` : ''}`
    ).join('\n\n')}

    Total duration: ${totalWeeks} weeks (${Math.round(totalWeeks/4)} months)

    Recommended Projects:
    ${learningPath.recommendedProjects.map((project: string, index: number) => 
      `${index + 1}. ${project}`
    ).join('\n    ')}

    Would you like to:
    1. Create a new AI-Buddy course for any of these topics
    2. Start a new learning path
    3. Ask specific questions about the recommended courses`;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (mode === 'course' && !courseName) {
        toast.error('Please select a course first');
        return;
    }

    if (mode === 'recommendation') {
      await handleLearningPathFlow(newMessage);
      return;
    }

    // Check for feedback command
    if (newMessage.toLowerCase() === 'feedback' && mode === 'course') {
        setIsFeedbackMode(true);
        setFeedbackStep('rating');
        
        const botMessage: Message = {
            id: messages.length + 2,
            text: "Please rate your experience with this course from 1 to 5 stars:",
            sender: 'bot',
            timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, {
            id: messages.length + 1,
            text: newMessage,
            sender: 'user',
            timestamp: new Date(),
        }, botMessage]);
        
        setNewMessage('');
        return;
    }

    // Handle feedback flow
    if (isFeedbackMode) {
        if (feedbackStep === 'rating') {
            const ratingNum = parseInt(newMessage);
            if (ratingNum >= 1 && ratingNum <= 5) {
                setRating(ratingNum);
                setFeedbackStep('comment');
                
                const botMessage: Message = {
                    id: messages.length + 2,
                    text: "Thanks! Now please share your thoughts about the course. What did you like? What could be improved?",
                    sender: 'bot',
                    timestamp: new Date(),
                };
                
                setMessages(prev => [...prev, {
                    id: messages.length + 1,
                    text: `Rating: ${ratingNum}/5`,
                    sender: 'user',
                    timestamp: new Date(),
                }, botMessage]);
                
                setNewMessage('');
                return;
            } else {
                const botMessage: Message = {
                    id: messages.length + 2,
                    text: "Please provide a valid rating between 1 and 5.",
                    sender: 'bot',
                    timestamp: new Date(),
                };
                
                setMessages(prev => [...prev, botMessage]);
                return;
            }
        }
        
        if (feedbackStep === 'comment') {
            try {
                // Send feedback to backend
                const response = await fetch('http://localhost:5001/api/feedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        courseName,
                        rating,
                        comment: newMessage,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to submit feedback');
                }

                const botMessage: Message = {
                    id: messages.length + 2,
                    text: "Thank you for your feedback! It helps us improve the course content. Is there anything else I can help you with?",
                    sender: 'bot',
                    timestamp: new Date(),
                };
                
                setMessages(prev => [...prev, {
                    id: messages.length + 1,
                    text: newMessage,
                    sender: 'user',
                    timestamp: new Date(),
                }, botMessage]);
                
                // Reset feedback mode
                setIsFeedbackMode(false);
                setFeedbackStep('initial');
                setRating(null);
                setNewMessage('');
                return;
            } catch (error) {
                console.error('Error submitting feedback:', error);
                toast.error('Failed to submit feedback');
            }
        }
    }

    // Regular chat flow
    const userMessage: Message = {
        id: messages.length + 1,
        text: newMessage,
        sender: 'user',
        timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);
    setRetryCount(0);

    const attemptRequest = async (attempt: number): Promise<any> => {
      try {
        const sanitizedCourseName = courseName?.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        
        const response = await fetch(`http://localhost:5001/api/${mode === 'course' ? 'chat' : 'recommend'}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: newMessage,
                courseName: sanitizedCourseName,
                sessionId: sessionId,
                mode: mode
            }),
        });

        let responseData;
        try {
            responseData = await response.json();
        } catch (parseError) {
            const rawText = await response.text();
            responseData = {
                answer: rawText,
                sessionId: sessionId
            };
        }

        if (!response.ok) {
            throw new Error(responseData.error || 'Failed to get response');
        }

        return responseData;
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          // Exponential backoff
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 8000);
          await delay(backoffDelay);
          return attemptRequest(attempt + 1);
        }
        throw error;
      }
    };

    try {
        const responseData = await attemptRequest(0);

        // Update session ID if provided
        if (responseData.sessionId) {
            setSessionId(responseData.sessionId);
        }

        const botMessage: Message = {
            id: messages.length + 2,
            text: responseData.answer || responseData,
            sender: 'bot',
            timestamp: new Date(),
            sectionInfo: responseData.section ? `Source: ${responseData.section}` : undefined
        };

        setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
        console.error('Error getting chat response:', error);
        
        const errorMessage = retryCount >= MAX_RETRIES 
          ? "I'm sorry, but I'm having persistent technical issues. Please try again later."
          : "I'm having trouble processing your request. Please try again.";
        
        toast.error("Chat service unavailable", {
          description: `Failed after ${retryCount + 1} attempts`
        });
        
        const botMessage: Message = {
            id: messages.length + 2,
            text: errorMessage,
            sender: 'bot',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([{
      id: 1,
      text: mode === 'course'
        ? "Hi! I'm your AI Buddy. How can I help you today?"
        : "Hi! I'm your learning advisor. What would you like to learn?",
      sender: 'bot',
      timestamp: new Date(),
    }]);
    // Reset session ID when clearing chat
    setSessionId(null);
    toast.success('Chat history cleared');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className={`bg-gray-800 border border-gray-700 rounded-lg shadow-xl transition-all duration-300 ${
          isExpanded ? 'w-[800px] h-[600px]' : 'w-80 md:w-96'
        }`}>
          {/* Chat Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-white font-medium">AI Buddy</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={handleClearChat}
                title="Clear chat history"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse chat" : "Expand chat"}
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className={`overflow-y-auto p-4 space-y-4 ${
            isExpanded ? 'h-[480px]' : 'h-96'
          }`}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  <p style={{ whiteSpace: 'pre-line' }}>{message.text}</p>
                  {message.sectionInfo && (
                    <p className="text-xs text-gray-300 mt-2 italic">
                      {message.sectionInfo}
                    </p>
                  )}
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                placeholder={mode === 'course' ? "Type your message..." : "What would you like to learn?"}
                className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                disabled={isLoading || (mode === 'course' && !courseName)}
              />
              <Button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                disabled={isLoading || (mode === 'course' && !courseName)}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {isLoading && (
              <p className="text-xs text-gray-400 mt-2 animate-pulse">
                Generating learning path...
              </p>
            )}
            {mode === 'course' && !courseName && (
              <p className="text-xs text-gray-400 mt-2">Please select a course to start chatting</p>
            )}
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default ChatBot; 