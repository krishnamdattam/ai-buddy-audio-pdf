import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { FaThumbsUp, FaThumbsDown, FaShare, FaFlag, FaSearch, FaUser } from 'react-icons/fa';

interface Slide {
  slide_name: string;
  type: string;
  title: string;
  content: string[];
  image: string | null;
  conversation: string;
}

interface PresentationData {
  presentation: {
    slides: Slide[];
  };
}

declare global {
  interface Window {
    handleAudioEnd: (slideIndex: number) => void;
    togglePlay: (index: number) => void;
    toggleVolume: (index: number) => void;
    changeVolume: (index: number, value: number) => void;
    changeSpeed: (index: number, value: string) => void;
    Reveal: any;
  }
}

const setupFullscreenControls = (): string => {
  return `
    function toggleFullScreen() {
      const elem = document.documentElement;
      const fullscreenBtn = document.querySelector('.fullscreen-btn i');
      
      if (!isFullScreen) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        }
        fullscreenBtn.className = 'fas fa-compress';
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        fullscreenBtn.className = 'fas fa-expand';
      }
      isFullScreen = !isFullScreen;
    }

    document.addEventListener('fullscreenchange', function() {
      const fullscreenBtn = document.querySelector('.fullscreen-btn i');
      isFullScreen = !!document.fullscreenElement;
      fullscreenBtn.className = isFullScreen ? 'fas fa-compress' : 'fas fa-expand';
    });
  `;
};

const setupAudioControls = (): string => {
  return `
    window.handleAudioEnd = function(slideIndex) {
      const totalSlides = document.querySelectorAll('.reveal .slides section').length;
      const button = document.querySelector('#audio-' + slideIndex).parentElement.querySelector('.play-pause i');
      button.className = 'fas fa-play';
      
      if (slideIndex < totalSlides - 1) {
        const countdownElement = document.getElementById('countdown-' + slideIndex);
        if (countdownElement) {
          countdownElement.style.display = 'block';
          countdownElement.innerHTML = '';
          countdownElement.style.animation = 'none';
          countdownElement.offsetHeight;
          countdownElement.style.animation = null;
        }

        countdownTimer = setTimeout(() => {
          Reveal.next();
        }, 5000);
      }
    };

    window.togglePlay = function(index) {
      const audio = document.getElementById('audio-' + index);
      const button = document.querySelector('#audio-' + index).parentElement.querySelector('.play-pause i');
      
      if (audio.paused) {
        audio.play();
        button.className = 'fas fa-pause';
      } else {
        audio.pause();
        button.className = 'fas fa-play';
      }
    };

    window.toggleVolume = function(index) {
      const audio = document.getElementById('audio-' + index);
      const button = document.querySelector('#audio-' + index).parentElement.querySelector('.volume i');
      
      if (audio.muted) {
        audio.muted = false;
        button.className = 'fas fa-volume-up';
      } else {
        audio.muted = true;
        button.className = 'fas fa-volume-mute';
      }
    };

    window.changeVolume = function(index, value) {
      const audio = document.getElementById('audio-' + index);
      const button = document.querySelector('#audio-' + index).parentElement.querySelector('.volume i');
      
      audio.volume = value / 100;
      if (value == 0) {
        button.className = 'fas fa-volume-mute';
      } else if (value < 50) {
        button.className = 'fas fa-volume-down';
      } else {
        button.className = 'fas fa-volume-up';
      }
    };

    window.changeSpeed = function(index, value) {
      const audio = document.getElementById('audio-' + index);
      audio.playbackRate = parseFloat(value);
    };
  `;
};

const SimplifiedPresentation: React.FC = () => {
  const { presentationId } = useParams<{ presentationId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presentationHtml, setPresentationHtml] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [notes, setNotes] = useState('');

  const generateRevealJsHtml = (presentation: PresentationData, theme: string = 'black'): string => {
    const slides = presentation.presentation.slides.map((slide, index) => {
      const imageHtml = slide.image 
        ? `<img src="/presentations/${slide.image}" alt="${slide.title}" style="max-width: 70%; margin: 15px auto; display: block; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">` 
        : '';
      
      const contentHtml = slide.content
        ? `<ul style="list-style-type: none; padding: 0; margin: 15px 0;">
            ${slide.content.map(item => `
              <li style="margin: 12px 0; font-size: 1em; line-height: 1.4;">
                ${item}
              </li>
            `).join('')}
          </ul>`
        : '';

      const audioHtml = slide.conversation
        ? `<div class="audio-container">
            <audio 
              id="audio-${index}"
              data-autoplay 
              src="/presentations/${slide.conversation}" 
              style="display: none;"
              onended="window.handleAudioEnd(${index})"
            ></audio>
            <div class="custom-audio-controls">
              <button class="audio-control-btn play-pause" onclick="togglePlay(${index})">
                <i class="fas fa-play"></i>
              </button>
              <div class="audio-control-group">
                <button class="audio-control-btn volume" onclick="toggleVolume(${index})">
                  <i class="fas fa-volume-up"></i>
                </button>
                <div class="volume-slider">
                  <input type="range" min="0" max="100" value="100" oninput="changeVolume(${index}, this.value)">
                </div>
              </div>
              <div class="speed-control">
                <select onchange="changeSpeed(${index}, this.value)">
                  <option value="0.5">0.5x</option>
                  <option value="1" selected>1x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>
            </div>
          </div>`
        : '';

      return `
        <section data-slide-index="${index}">
          <div class="slide-header">
            <h2 style="color: #fff; font-size: 1.8em; margin: 0; padding: 20px 0; text-align: left; font-weight: bold;">${slide.title}</h2>
            <hr class="title-separator" />
          </div>
          <div class="slide-content" style="max-width: 95%; margin: 0 auto;">
            ${contentHtml}
            ${imageHtml}
            ${audioHtml}
            <div id="countdown-${index}" class="countdown-timer" style="display: none; text-align: center; margin-top: 15px; color: #42affa; font-size: 1.2em;"></div>
          </div>
        </section>
      `;
    }).join('');

    const scriptContent = `
      let revealInstance;
      let countdownTimer = null;
      let isFullScreen = false;

      ${setupFullscreenControls()}
      ${setupAudioControls()}

      // Initialize Reveal.js
      window.addEventListener('load', function() {
        revealInstance = Reveal.initialize({
          controls: true,
          progress: true,
          center: false,
          hash: true,
          width: '100%',
          height: '100%',
          margin: 0.05,
          minScale: 0.2,
          maxScale: 1.5,
          transition: 'slide',
          backgroundTransition: 'fade',
          view: 'scroll',
          autoPlayMedia: true,
          preloadIframes: true,
          display: 'flex',
          showProgress: true,
          progressStyle: 'bar',
          dependencies: []
        });

        // Add audio progress bar
        const audioProgressDiv = document.createElement('div');
        audioProgressDiv.className = 'audio-progress';
        const audioProgressBar = document.createElement('div');
        audioProgressBar.className = 'audio-progress-bar';
        audioProgressDiv.appendChild(audioProgressBar);
        document.body.appendChild(audioProgressDiv);

        // Initialize progress bar for first slide
        const totalSlides = document.querySelectorAll('.reveal .slides section').length;
        const progressBar = document.querySelector('.reveal .progress span');
        if (progressBar) {
          progressBar.style.width = (1 / totalSlides * 100) + '%';
        }

        // Play first slide's audio if it exists
        const firstSlideAudio = document.getElementById('audio-0');
        if (firstSlideAudio) {
          firstSlideAudio.play().catch(console.error);
          firstSlideAudio.addEventListener('timeupdate', function() {
            const progress = (firstSlideAudio.currentTime / firstSlideAudio.duration) * 100;
            const audioProgressBar = document.querySelector('.audio-progress-bar');
            if (audioProgressBar) {
              audioProgressBar.style.width = progress + '%';
            }
          });
        }

        // Handle slide change
        Reveal.on('slidechanged', function(event) {
          // Update progress bar
          const currentSlideIndex = event.indexh;
          const totalSlides = document.querySelectorAll('.reveal .slides section').length;
          const progress = (currentSlideIndex + 1) / totalSlides;
          const progressBar = document.querySelector('.reveal .progress span');
          if (progressBar) {
            progressBar.style.width = (progress * 100) + '%';
          }

          // Reset audio progress
          const audioProgressBar = document.querySelector('.audio-progress-bar');
          if (audioProgressBar) {
            audioProgressBar.style.width = '0%';
          }

          // Clear any existing countdown
          if (countdownTimer) {
            clearTimeout(countdownTimer);
            countdownTimer = null;
          }

          // Hide all countdown timers
          document.querySelectorAll('.countdown-timer').forEach(timer => {
            timer.style.display = 'none';
          });

          window.parent.postMessage({ 
            type: 'slideChanged', 
            index: event.indexh 
          }, '*');

          // Play audio of the new slide if it exists
          const currentSlide = event.currentSlide;
          const slideIndex = currentSlide.getAttribute('data-slide-index');
          const audio = document.getElementById('audio-' + slideIndex);
          if (audio) {
            audio.currentTime = 0;
            audio.play().catch(console.error);

            // Update audio progress
            audio.addEventListener('timeupdate', function() {
              const progress = (audio.currentTime / audio.duration) * 100;
              const audioProgressBar = document.querySelector('.audio-progress-bar');
              if (audioProgressBar) {
                audioProgressBar.style.width = progress + '%';
              }
            });
          }
        });

        // Update play button when audio starts playing
        document.querySelectorAll('audio').forEach((audio, index) => {
          audio.addEventListener('play', function() {
            const button = document.querySelector('#audio-' + index).parentElement.querySelector('.play-pause i');
            button.className = 'fas fa-pause';
          });
        });
      });
    `;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Simplified Presentation</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reset.css">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.css">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/theme/${theme}.css">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
          <style>
            :root {
              --r-background-color: #1a1a1a;
              --r-main-font: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              --r-main-font-size: 32px;
              --r-main-color: #fff;
              --r-heading-font: var(--r-main-font);
              --r-heading-color: #fff;
              --r-heading-line-height: 1.2;
              --r-heading-letter-spacing: -0.02em;
              --r-heading-text-transform: none;
              --r-heading-text-shadow: none;
              --r-heading-font-weight: 600;
              --r-heading1-size: 2em;
              --r-heading2-size: 1.4em;
              --r-heading3-size: 1.2em;
              --r-heading4-size: 1em;
              --r-code-font: monospace;
              --r-link-color: #42affa;
              --r-link-color-dark: #068de9;
              --r-link-color-hover: #8dcffc;
              --r-selection-background-color: rgba(66, 175, 250, 0.75);
              --r-selection-color: #fff;
            }

            .reveal {
              font-family: var(--r-main-font);
              font-size: var(--r-main-font-size);
              font-weight: normal;
              color: var(--r-main-color);
            }

            .reveal .slides { 
              text-align: left;
              width: 95%;
              height: 95%;
              max-width: 1200px;
            }

            .reveal .slides section {
              padding: 20px;
              height: 100%;
              display: flex;
              flex-direction: column;
            }

            .reveal pre { 
              width: 100%; 
            }

            .reveal section img { 
              margin: 15px 0px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              border-radius: 8px;
            }

            .reveal .slide-content { 
              font-size: 0.9em;
              flex-grow: 1;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              overflow-y: auto;
              padding-right: 10px;
            }

            .reveal .slide-header {
              width: 95%;
              margin: 0 auto;
              position: relative;
            }

            .reveal .title-separator {
              border: 0;
              height: 2px;
              background: linear-gradient(to right, #42affa, rgba(66, 175, 250, 0.1));
              margin: 0 0 20px 0;
            }

            .reveal ul {
              list-style: none;
              margin: 0;
              padding: 0;
            }

            .reveal li {
              margin: 10px 0;
              font-size: 1em;
              line-height: 1.4;
              position: relative;
              padding-left: 20px;
            }

            .reveal li:before {
              content: "•";
              color: #42affa;
              position: absolute;
              left: 0;
            }

            .reveal audio {
              width: 100%;
              max-width: 500px;
              margin: 15px auto;
              border-radius: 8px;
              background: rgba(255, 255, 255, 0.1);
            }

            .reveal audio::-webkit-media-controls-panel {
              background: rgba(255, 255, 255, 0.1);
            }

            .reveal audio::-webkit-media-controls-current-time-display,
            .reveal audio::-webkit-media-controls-time-remaining-display {
              color: #fff;
            }

            .reveal .controls {
              color: #fff;
            }

            .reveal .progress {
              color: rgba(255, 255, 255, 0.2);
              position: fixed;
              bottom: 16px;
              left: 16px;
              width: 200px;
              height: 4px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 2px;
              overflow: hidden;
              z-index: 30;
            }

            .reveal .progress span {
              display: block;
              background: linear-gradient(90deg, #42affa 0%, #4299e1 100%);
              position: absolute;
              left: 0;
              top: 0;
              height: 100%;
              width: 0;
              border-radius: 2px;
              transition: width 0.8s cubic-bezier(0.26, 0.86, 0.44, 0.985);
            }

            /* Custom scrollbar for slide content */
            .reveal .slide-content::-webkit-scrollbar {
              width: 6px;
            }

            .reveal .slide-content::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 3px;
            }

            .reveal .slide-content::-webkit-scrollbar-thumb {
              background: rgba(66, 175, 250, 0.5);
              border-radius: 3px;
            }

            .reveal .slide-content::-webkit-scrollbar-thumb:hover {
              background: rgba(66, 175, 250, 0.7);
            }

            @keyframes countdown {
              from { width: 100%; }
              to { width: 0%; }
            }

            .countdown-timer {
              position: relative;
              padding: 10px;
              border-radius: 4px;
              background: rgba(66, 175, 250, 0.1);
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              height: 4px;
              padding: 0;
            }

            .countdown-timer i {
              display: none;
            }

            @keyframes pulse {
              0% {
                transform: scale(1);
                opacity: 1;
              }
              50% {
                transform: scale(1.2);
                opacity: 0.7;
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }

            .countdown-timer::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              height: 100%;
              width: 100%;
              background: linear-gradient(90deg, #42affa 0%, #4299e1 100%);
              animation: countdown 5s linear;
            }

            /* Custom progress bar for audio */
            .audio-progress {
              position: fixed;
              bottom: 32px;
              left: 16px;
              width: 200px;
              height: 4px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 2px;
              overflow: hidden;
              z-index: 30;
            }

            .audio-progress-bar {
              height: 100%;
              background: linear-gradient(90deg, #42affa 0%, #4299e1 100%);
              border-radius: 2px;
              width: 0;
              transition: width 0.1s linear;
            }

            /* Fullscreen button */
            .fullscreen-btn {
              position: fixed;
              top: 16px;
              right: 16px;
              background: rgba(66, 175, 250, 0.2);
              color: #42affa;
              border: none;
              border-radius: 4px;
              padding: 8px;
              cursor: pointer;
              transition: all 0.3s ease;
              z-index: 40;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .fullscreen-btn:hover {
              background: rgba(66, 175, 250, 0.3);
              transform: scale(1.05);
            }

            .fullscreen-btn i {
              font-size: 1.2em;
            }

            .audio-container {
              position: fixed;
              top: 16px;
              right: 60px;
              background: rgba(0, 0, 0, 0.6);
              border-radius: 8px;
              padding: 6px;
              display: flex;
              align-items: center;
              z-index: 40;
              backdrop-filter: blur(4px);
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
            }

            .custom-audio-controls {
              display: flex;
              flex-direction: row;
              gap: 8px;
              align-items: center;
            }

            .audio-control-btn {
              background: none;
              border: none;
              color: #42affa;
              cursor: pointer;
              padding: 4px;
              border-radius: 4px;
              transition: all 0.3s ease;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .audio-control-btn:hover {
              background: rgba(66, 175, 250, 0.2);
              transform: scale(1.1);
            }

            .audio-control-btn i {
              font-size: 1em;
            }

            .audio-control-group {
              position: relative;
              display: flex;
              align-items: center;
            }

            .volume-slider {
              display: none;
              position: absolute;
              left: 50%;
              top: 100%;
              transform: translateX(-50%);
              background: rgba(0, 0, 0, 0.8);
              padding: 6px;
              border-radius: 4px;
              margin-top: 6px;
            }

            .audio-control-group:hover .volume-slider {
              display: block;
            }

            .volume-slider input[type="range"] {
              width: 80px;
              height: 4px;
              -webkit-appearance: none;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 2px;
              outline: none;
            }

            .volume-slider input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              width: 10px;
              height: 10px;
              background: #42affa;
              border-radius: 50%;
              cursor: pointer;
            }

            .speed-control select {
              background: none;
              border: none;
              color: #42affa;
              cursor: pointer;
              padding: 2px 6px;
              font-size: 0.8em;
              outline: none;
              -webkit-appearance: none;
              text-align: center;
              border-radius: 4px;
            }

            .speed-control select:hover {
              background: rgba(66, 175, 250, 0.2);
            }

            .speed-control select option {
              background: #1a1a1a;
              color: #fff;
              padding: 4px;
            }
          </style>
        </head>
        <body>
          <div class="reveal">
            <div class="slides">
              ${slides}
            </div>
            <button class="fullscreen-btn" onclick="toggleFullScreen()">
              <i class="fas fa-expand"></i>
            </button>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.js"></script>
          <script>${scriptContent}</script>
        </body>
      </html>
    `;
  };

  const getPresentationPath = (id: string): string => {
    console.log('Loading presentation with ID:', id);
    const presentations: { [key: string]: string } = {
      'secure': '/presentations/Secure_Printing_Presentation.json',
      'printing': '/presentations/Printing_Presentation.json'
    };
    const path = presentations[id] || presentations['secure'];
    console.log('Using path:', path);
    return path;
  };

  useEffect(() => {
    const loadPresentation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const presentationPath = getPresentationPath(presentationId || 'secure');
        const response = await fetch(presentationPath);
        if (!response.ok) {
          throw new Error('Failed to fetch presentation data');
        }

        const presentationData: PresentationData = await response.json();
        const html = generateRevealJsHtml(presentationData);
        setPresentationHtml(html);

      } catch (error) {
        console.error('Error loading presentation:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load presentation';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadPresentation();
  }, [presentationId]);

  useEffect(() => {
    if (!presentationHtml || !iframeRef.current) return;

    try {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!iframeDoc) {
        throw new Error('Cannot access iframe document');
      }

      iframeDoc.open();
      iframeDoc.write(presentationHtml);
      iframeDoc.close();

      const handleIframeMessage = (event: MessageEvent) => {
        if (event.data?.type === 'slideChanged') {
          setCurrentSlide(event.data.index);
        }
      };

      window.addEventListener('message', handleIframeMessage);
      
      return () => {
        window.removeEventListener('message', handleIframeMessage);
      };

    } catch (error) {
      console.error('Iframe error:', error);
      setError('Failed to initialize presentation');
      toast.error('Failed to initialize presentation');
    }
  }, [presentationHtml]);

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

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1d24] flex items-center justify-center p-4">
        <div className="bg-red-900/50 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-200 mb-4">Error Loading Presentation</h2>
          <p className="text-red-100 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Return to Dashboard
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
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-[#2e3440] text-gray-300 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center gap-2 text-gray-300">
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
      </div>

      {/* Footer */}
      <footer className="bg-[#232730] border-t border-[#2e3440] py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-gray-400">
          <p>© 2025 AI-Buddy. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Version 0.0.9</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SimplifiedPresentation; 