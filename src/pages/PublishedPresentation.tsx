import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PresentationService } from '../services/presentationService';
import { Presentation } from '../types/presentation';
import { toast } from 'sonner';
import { FaThumbsUp, FaThumbsDown, FaShare, FaFlag, FaRegCommentDots, FaSearch, FaUser, FaUserCircle } from 'react-icons/fa';
import ChatBot from '../components/ChatBot';

interface PublishedPresentationProps {
  courseName: string;
  theme?: string;
  presentationFile?: string;
}

const TEST_HTML = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Presentation</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reset.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/theme/black.css">
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/plugin/notes/notes.js"></script>
    <style>
      .reveal .slides { text-align: left; }
      .reveal pre { width: 100%; }
      #error-display {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ff0000;
        color: white;
        padding: 20px;
        border-radius: 8px;
        display: none;
        z-index: 9999;
      }
      /* Add styles for audio controls if needed */
      .reveal audio {
        margin: 10px 0;
      }
    </style>
  </head>
  <body>
    <div id="error-display"></div>
    <div class="reveal">
      <div class="slides">
        <section>
          <h1>Test Slide</h1>
          <p>If you can see this, reveal.js is working!</p>
          <p>Current time: <span id="current-time"></span></p>
        </section>
        <section>
          <h2>Second Slide</h2>
          <ul>
            <li>Test bullet point 1</li>
            <li>Test bullet point 2</li>
          </ul>
        </section>
      </div>
    </div>
    <script>
      // Update time to verify script execution
      document.getElementById('current-time').textContent = new Date().toISOString();

      // Error handling
      function showError(message) {
        const errorDisplay = document.getElementById('error-display');
        errorDisplay.textContent = message;
        errorDisplay.style.display = 'block';
        console.error('[Test Error]', message);
        window.parent.postMessage('revealError', '*');
      }

      // Load reveal.js
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.js';
      script.onload = function() {
        console.log('[Test] Reveal.js script loaded');
        initializeReveal();
      };
      script.onerror = function() {
        showError('Failed to load reveal.js script');
      };
      document.body.appendChild(script);

      function initializeReveal() {
        console.log('[Test] Starting reveal initialization...');
        try {
          if (typeof Reveal === 'undefined') {
            showError('Reveal is not defined after script load');
            return;
          }

          Reveal.initialize({
            controls: true,
            progress: true,
            center: true,
            hash: true,
            view: 'scroll',
            plugins: [ RevealNotes ]
          }).then(() => {
            console.log('[Test] Reveal initialized successfully');
            window.parent.postMessage('revealReady', '*');
          }).catch(error => {
            showError('Reveal initialization failed: ' + error.message);
          });
        } catch (error) {
          showError('Error in reveal setup: ' + error.message);
        }
      }
    </script>
  </body>
</html>
`;

const PublishedPresentation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presentationHtml, setPresentationHtml] = useState<string | null>(null);
  const [isTestMode] = useState(false);
  const [key, setKey] = useState(0);
  const [notes, setNotes] = useState('');
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [slideToSectionMap, setSlideToSectionMap] = useState<number[]>([]);
  const [sectionToSlideMap, setSectionToSlideMap] = useState<number[]>([]);

  const handleDebugClick = () => {
    console.log('Debug Info:', {
      isLoading,
      error,
      hasHtml: !!presentationHtml,
      iframeExists: !!iframeRef.current,
      location: window.location.href,
      state: location.state
    });
    setKey(prev => prev + 1);
  };

  const handleBackToCanvas = () => {
    const state = location.state as PublishedPresentationProps;
    if (state?.courseName) {
      navigate('/presentation-canvas', {
        state: {
          courseName: state.courseName,
          presentationFile: state.presentationFile || `${state.courseName}_presentation.json`
        }
      });
    } else {
      // Fallback to dashboard if no state
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    const loadPresentation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (isTestMode) {
          console.log('[PublishedPresentation] Running in test mode');
          setPresentationHtml(TEST_HTML);
          setIsLoading(false);
          return;
        }

        const state = location.state as PublishedPresentationProps;
        if (!state?.courseName) {
          throw new Error('Course name is required');
        }

        const { theme = 'black', courseName, presentationFile } = state;
        console.log('[PublishedPresentation] Loading presentation:', { courseName, theme, presentationFile });

        // Load both presentation and course data
        const [presentationResponse, courseResponse] = await Promise.all([
          fetch(`http://localhost:5001/api/courses/${courseName}/${presentationFile || `${courseName}_presentation.json`}`),
          fetch(`http://localhost:5001/api/courses/${courseName}/${courseName}.json`)
        ]);

        // Add response status logging
        console.log('[PublishedPresentation] Response status:', {
          presentation: presentationResponse.status,
          course: courseResponse.status
        });

        if (!presentationResponse.ok || !courseResponse.ok) {
          throw new Error('Failed to fetch presentation or course data');
        }

        const [presentationData, courseData] = await Promise.all([
          presentationResponse.json(),
          courseResponse.json()
        ]);

        // Log raw response data
        console.log('[PublishedPresentation] Raw data:', {
          presentation: presentationData,
          course: courseData
        });

        // Verify audioFiles exists in course data
        if (!courseData.audioFiles) {
          console.warn('[PublishedPresentation] No audioFiles found in course data');
        }

        // Merge audioFiles from course data into presentation data
        const mergedPresentation = {
          ...presentationData,
          audioFiles: courseData.audioFiles || []
        };

        console.log('[PublishedPresentation] Merged data:', {
          courseName: mergedPresentation.courseName,
          audioFiles: mergedPresentation.audioFiles,
          sections: mergedPresentation.sections.map(s => ({
            title: s.title,
            type: s.type
          }))
        });
        setPresentation(mergedPresentation);

        const html = PresentationService.generateRevealJsHtml(mergedPresentation, theme);
        if (!html) {
          throw new Error('Failed to generate presentation HTML');
        }
        setPresentationHtml(html);

        // Create mapping between slides and sections
        let currentSlide = 0;
        const slideToSection: number[] = [];
        const sectionToSlide: number[] = [];

        mergedPresentation.sections.forEach((section, sectionIndex) => {
          sectionToSlide[sectionIndex] = currentSlide;
          
          // For welcome sections, we need two slides
          if (section.type === 'welcome') {
            slideToSection[currentSlide] = sectionIndex;
            slideToSection[currentSlide + 1] = sectionIndex;
            currentSlide += 2;
          } else {
            slideToSection[currentSlide] = sectionIndex;
            currentSlide += 1;
          }
        });

        setSlideToSectionMap(slideToSection);
        setSectionToSlideMap(sectionToSlide);

        // Add logo HTML if it exists in the presentation config
        if (mergedPresentation.presentationConfig?.logo) {
          const logoHtml = `
            <div class="presentation-logo-container">
              <img 
                src="${mergedPresentation.presentationConfig.logo.src}" 
                class="presentation-logo"
                alt="Company Logo"
              />
            </div>
          `;
          
          // Add logo styles
          const logoStyles = `
            .presentation-logo-container {
              position: fixed;
              top: 10px;
              left: 10px;
              z-index: 9999;
              pointer-events: none;
              user-select: none;
            }

            .presentation-logo {
              max-height: 40px;
              width: auto;
              display: block;
            }

            .reveal .slides {
              margin-top: 30px;
            }

            .reveal .presentation-logo-container {
              position: fixed !important;
              transform: none !important;
              transition: none !important;
            }
          `;

          // Add logo styles to the document
          const styleElement = document.createElement('style');
          styleElement.textContent = logoStyles;
          document.head.appendChild(styleElement);

          // Add logo HTML to the presentation
          const revealElement = document.querySelector('.reveal');
          if (revealElement) {
            revealElement.insertAdjacentHTML('afterbegin', logoHtml);
          }
        }

        // Initialize Reveal.js
        const Reveal = window.Reveal;
        if (Reveal) {
          Reveal.initialize({
            controls: true,
            progress: true,
            center: true,
            hash: true,
            view: 'scroll',
            plugins: [ RevealNotes ]
          });
        }

      } catch (error) {
        console.error('[PublishedPresentation] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load presentation';
        setError(errorMessage);
        toast.error(errorMessage);
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadPresentation();
  }, [location.state, isTestMode, navigate]);

  useEffect(() => {
    if (!presentationHtml || !iframeRef.current) return;

    try {
      console.log('[PublishedPresentation] Setting up iframe...');
      
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!iframeDoc) {
        throw new Error('Cannot access iframe document');
      }

      iframeDoc.open();
      iframeDoc.write(presentationHtml);
      iframeDoc.close();

      const handleIframeMessage = (event: MessageEvent) => {
        if (event.data === 'revealReady') {
          console.log('[PublishedPresentation] Reveal.js initialized successfully');
        } else if (event.data === 'revealError') {
          console.error('[PublishedPresentation] Reveal.js initialization failed');
          setError('Failed to initialize presentation viewer');
          toast.error('Failed to initialize presentation viewer');
        } else if (event.data?.type === 'sectionChanged') {
          const slideIndex = event.data.index;
          const sectionIndex = slideToSectionMap[slideIndex];
          if (sectionIndex !== undefined) {
            setCurrentSection(sectionIndex);
          }
        }
      };

      window.addEventListener('message', handleIframeMessage);
      
      return () => {
        window.removeEventListener('message', handleIframeMessage);
      };

    } catch (error) {
      console.error('[PublishedPresentation] Iframe error:', error);
      setError('Failed to initialize presentation');
      toast.error('Failed to initialize presentation');
    }
  }, [presentationHtml, slideToSectionMap]);

  const handleLike = () => {
    if (!hasLiked) {
      setLikes(prev => prev + 1);
      if (hasDisliked) {
        setDislikes(prev => prev - 1);
        setHasDisliked(false);
      }
      setHasLiked(true);
    } else {
      setLikes(prev => prev - 1);
      setHasLiked(false);
    }
  };

  const handleDislike = () => {
    if (!hasDisliked) {
      setDislikes(prev => prev + 1);
      if (hasLiked) {
        setLikes(prev => prev - 1);
        setHasLiked(false);
      }
      setHasDisliked(true);
    } else {
      setDislikes(prev => prev - 1);
      setHasDisliked(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleReport = () => {
    toast.info('Report functionality coming soon');
  };

  const handleSectionClick = (sectionIndex: number) => {
    if (iframeRef.current?.contentWindow && sectionToSlideMap[sectionIndex] !== undefined) {
      const targetSlide = sectionToSlideMap[sectionIndex];
      iframeRef.current.contentWindow.postMessage({ type: 'navigateToSection', index: targetSlide }, '*');
      setCurrentSection(sectionIndex);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1d24] flex items-center justify-center p-4">
        <div className="bg-red-900/50 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-200 mb-4">Error Loading Presentation</h2>
          <p className="text-red-100 mb-4">{error}</p>
          <button
            onClick={() => navigate('/presentation-canvas')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Return to Canvas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1d24] flex flex-col">
      {/* Navbar */}
      <nav className="bg-[#232730] border-b border-[#2e3440] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div 
                onClick={() => navigate('/dashboard')}
                className="text-purple-500 font-bold text-xl cursor-pointer hover:text-purple-400 transition-colors"
              >
                AI-Buddy
              </div>
              <button
                onClick={handleBackToCanvas}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Edit in Canvas
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search courses..."
                  className="bg-[#2e3440] text-gray-300 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span>Welcome Vijay</span>
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                  <FaUser className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Presentation Area */}
        <div className="flex-1 p-4">
          <div className="relative bg-[#232730] rounded-lg overflow-hidden shadow-xl">
            {isLoading && (
              <div className="absolute inset-0 bg-[#1a1d24]/90 flex items-center justify-center z-50">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-purple-300 text-lg">Loading presentation...</p>
                </div>
              </div>
            )}
            
            <iframe
              key={key}
              ref={iframeRef}
              className="w-full aspect-video rounded-lg"
              title="presentation"
              allow="autoplay"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />

            {/* Interaction Buttons */}
            <div className="bg-[#2e3440] p-4 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                      hasLiked ? 'bg-purple-600 text-white' : 'bg-[#3b4252] text-gray-300'
                    } hover:bg-purple-500 transition-colors`}
                  >
                    <FaThumbsUp /> {likes}
                  </button>
                  <button
                    onClick={handleDislike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                      hasDisliked ? 'bg-red-600 text-white' : 'bg-[#3b4252] text-gray-300'
                    } hover:bg-red-500 transition-colors`}
                  >
                    <FaThumbsDown /> {dislikes}
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#3b4252] text-gray-300 hover:bg-[#434c5e] transition-colors"
                  >
                    <FaShare /> Share
                  </button>
                  <button
                    onClick={handleReport}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#3b4252] text-gray-300 hover:bg-[#434c5e] transition-colors"
                  >
                    <FaFlag /> Report
                  </button>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="mt-4 bg-[#2e3440] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Notes:</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-32 bg-[#3b4252] text-white rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="Take notes during the presentation..."
              />
            </div>
          </div>
        </div>

        {/* Side Navigation */}
        <div className="w-80 bg-[#232730] border-l border-[#2e3440] p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            Slides
          </h2>
          <div className="space-y-2">
            {presentation?.sections.map((section, index) => (
              <div
                key={index}
                onClick={() => handleSectionClick(index)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  currentSection === index
                    ? 'bg-purple-900/50 border border-purple-500'
                    : 'bg-purple-800/20 border border-transparent hover:border-purple-500/50'
                }`}
              >
                <h3 className="text-sm font-medium text-white">Slide {index + 1}</h3>
                <p className="text-gray-300 text-sm mt-1">{section.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat and AI Avatar Controls */}
      <div className="fixed bottom-20 right-12 z-50">
        <div className="flex flex-row gap-4 items-center">
          {/* AI Avatar Button */}
          <button 
            className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 transition-colors flex items-center justify-center shadow-lg"
            onClick={() => toast.info('AI Avatar feature coming soon!')}
          >
            <FaUserCircle className="text-white text-2xl" />
          </button>
          
          {/* Existing ChatBot Component */}
          <ChatBot courseName={location.state?.courseName} />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#232730] border-t border-[#2e3440] py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-gray-400">
          <p>© 2025 AI-Buddy. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Version 0.0.9</span>
            <span>•</span>
            <span>Created by Vijay Betigiri (vijay.betigiri@swisscom.com)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublishedPresentation; 