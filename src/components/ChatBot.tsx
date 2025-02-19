import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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
        : "👋 I'm your learning advisor!\n\nI can help you:\n• Find courses based on your interests\n• Recommend learning paths\n• Suggest course creation\n\nWhat would you like to learn?",
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (mode === 'course' && !courseName) {
        toast.error('Please select a course first');
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

    try {
        const sanitizedCourseName = courseName?.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        
        const response = await fetch(`http://localhost:5001/api/${mode === 'course' ? 'chat' : 'recommend'}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                question: newMessage,
                courseName: sanitizedCourseName,
                sessionId: sessionId,
                mode: mode
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get response');
        }

        const data = await response.json();
        
        if (data.sessionId) {
            setSessionId(data.sessionId);
        }

        const botMessage: Message = {
            id: messages.length + 2,
            text: data.answer,
            sender: 'bot',
            timestamp: new Date(),
            sectionInfo: data.section ? `Source: ${data.section}` : undefined
        };

        setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
        console.error('Error getting chat response:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error(`Chat error: ${errorMessage}`);
        
        const botMessage: Message = {
            id: messages.length + 2,
            text: `I'm sorry, I encountered an error: ${errorMessage}. Please try again.`,
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