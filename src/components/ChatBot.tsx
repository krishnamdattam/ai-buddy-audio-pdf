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
        ? "👋 I'm your buddy!\n\nAsk a question\nType 'quiz' to test yourself\nType 'feedback' to share thoughts"
        : "👋 I'm your learning advisor!\n\nI can help you:\n• Find courses based on your interests\n• Recommend learning paths\n• Suggest course creation\n\nWhat would you like to learn?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (mode === 'course' && !courseName) return;

    // Add user message
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
      // Send request to backend with sessionId if available
      const response = await fetch(`http://localhost:5001/api/${mode === 'course' ? 'chat' : 'recommend'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: newMessage,
          courseName: courseName,
          sessionId: sessionId,
          mode: mode
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Store the session ID if received
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
      
      // Add bot response
      let responseText = typeof data.answer === 'string' 
        ? data.answer 
        : data.answer?.response || "I apologize, but I couldn't process your request at the moment.";

      if (mode === 'recommendation' && responseText.includes("I couldn't find any specific courses matching your interests")) {
        responseText = "I see that this course is not currently available in our library. Would you like to create a new course based on your documents?\n\nYou can create a new course by:\n1. Clicking 'Get Started' in the 'Create New Course' section\n2. Uploading your learning materials\n3. Choosing a template and persona\n\nWould you like me to help you get started?";
      }
      
      const botMessage: Message = {
        id: messages.length + 2,
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
        sectionInfo: data.section ? `Source: ${data.section}` : undefined
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting chat response:', error);
      toast.error('Failed to get response from AI');
      
      // Add error message
      const errorMessage: Message = {
        id: messages.length + 2,
        text: "I'm sorry, I encountered an error while processing your request.",
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
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