import { Section, Presentation } from '../types/presentation';

interface RevealSlide {
  content: string;
  attributes?: {
    [key: string]: string | number | boolean;
  };
}

const DEBUG = true; // Enable debug mode

declare global {
  interface Window {
    Reveal: any;
    testAudioPlayback: (button: HTMLButtonElement) => void;
    loadActualAudio: (button: HTMLButtonElement) => void;
  }
}

export class PresentationService {
  private static log(message: string, data?: any) {
    if (DEBUG) {
      console.log(`[PresentationService] ${message}`, data || '');
    }
  }

  private static error(message: string, error?: any) {
    console.error(`[PresentationService] ${message}`, error || '');
  }

  private static generateTitleSlide(courseName: string): RevealSlide {
    return {
      content: `
        <section>
          <h1>${courseName}</h1>
          <p>Interactive Course Presentation</p>
        </section>
      `,
      attributes: {
        'data-transition': 'zoom'
      }
    };
  }

  private static generateSectionSlide(section: Section, presentation: Presentation): RevealSlide {
    switch (section.type) {
      case 'welcome':
        return {
          content: `
            <section>
              <h1>${section.title}</h1>
              ${section.summary_points ? `
                <ul class="summary-points">
                  ${section.summary_points.map(point => `<li>${point}</li>`).join('\n')}
                </ul>
              ` : ''}
            </section>
          `,
          attributes: {
            'data-transition': 'zoom'
          }
        };

      case 'overview':
        return {
          content: `
            <section>
              <h2>${section.title}</h2>
              ${section.metadata ? `
                <div class="metadata-grid">
                  <div class="metadata-section">
                    <h3>Prerequisites</h3>
                    <ul>
                      ${section.metadata.prerequisites.map(prereq => `<li>${prereq}</li>`).join('\n')}
                    </ul>
                  </div>
                  <div class="metadata-section">
                    <h3>Learning Goals</h3>
                    <ul>
                      ${section.metadata.learningGoals.map(goal => `<li>${goal}</li>`).join('\n')}
                    </ul>
                  </div>
                  <div class="metadata-section">
                    <h3>Estimated Time</h3>
                    <p>${section.metadata.estimatedTime}</p>
                  </div>
                </div>
              ` : ''}
              <aside class="notes">
                <h3>Speaker Notes for Course Overview</h3>
                <ul>
                  <li>Welcome the participants and introduce yourself</li>
                  <li>Explain the importance of understanding prerequisites</li>
                  <li>Highlight key learning objectives and their practical applications</li>
                  <li>Set expectations about the course duration and pace</li>
                  <li>Encourage questions and participation</li>
                </ul>
                ${section.metadata ? `
                <p>Prerequisites to emphasize:</p>
                <ul>
                  ${section.metadata.prerequisites.map(prereq => `<li>Discuss importance of: ${prereq}</li>`).join('\n')}
                </ul>
                <p>Learning goals to highlight:</p>
                <ul>
                  ${section.metadata.learningGoals.map(goal => `<li>Emphasize outcome: ${goal}</li>`).join('\n')}
                </ul>
                ` : ''}
              </aside>
            </section>
          `,
          attributes: {
            'data-transition': 'slide'
          }
        };

      case 'section_header':
        return {
          content: `
            <section>
              <h2>${section.title}</h2>
              <div class="header-line"></div>
            </section>
          `,
          attributes: {
            'data-transition': 'fade'
          }
        };

      case 'content':
        const audioFileName = section.audio_url ? section.audio_url.split('/').pop() : '';
        const courseName = presentation.courseName;
        
        return {
          content: `
            <section>
              <h2>${section.title}</h2>
              ${section.summary_points ? `
                <ul class="content-points">
                  ${section.summary_points.map(point => `<li>${point}</li>`).join('\n')}
                </ul>
              ` : ''}
              ${section.audio_url ? `
                <div class="audio-container" id="audio-container-${audioFileName}">
                  <div class="audio-wrapper">
                    <audio 
                      class="presentation-audio"
                      controls
                      data-autoplay
                      data-course="${courseName}"
                      data-filename="${audioFileName}"
                      src="/src/assets/audio/${courseName}/${audioFileName}"
                      onloadedmetadata="this.closest('section').dataset.autoslide = Math.ceil(this.duration * 1000)"
                    >
                      <p>Your browser doesn't support HTML5 audio.</p>
                    </audio>
                    <div class="audio-loading-indicator" style="display: none;">
                      <div class="loading-spinner"></div>
                      <span>Loading audio...</span>
                    </div>
                    <div class="audio-error" style="display: none;">
                      <p>Error loading audio. Please try again.</p>
                    </div>
                  </div>
                </div>
              ` : ''}
              <aside class="notes">
                <h3>Speaker Notes for ${section.title}</h3>
                <ul>
                  ${section.summary_points ? section.summary_points.map(point => `
                    <li>Explain: ${point}</li>
                    <li>Provide real-world examples or scenarios related to this point</li>
                  `).join('\n') : ''}
                </ul>
                <p>Key reminders:</p>
                <ul>
                  <li>Engage with the audience by asking questions</li>
                  <li>Share relevant industry examples</li>
                  <li>Address common misconceptions</li>
                  ${section.audio_url ? '<li>Ensure audio is clear and audible</li>' : ''}
                </ul>
              </aside>
            </section>
          `,
          attributes: {
            'data-transition': 'slide',
            'data-autoslide': section.audio_url ? 0 : 0
          }
        };

      case 'quiz':
        return {
          content: `
            <section>
              <div class="trophy-counter">
                ${Array(section.quiz_questions.length).fill('🏆').map((trophy, i) => 
                  `<span class="trophy-icon" data-trophy-index="${i}">${trophy}</span>`
                ).join('')}
              </div>
              <h2>${section.title}</h2>
              <h3>Knowledge Check</h3>
              <p>Test your understanding with these questions.</p>
              <div class="vertical-nav-hint with-animation">
                <p>Press ↓ to start quiz</p>
              </div>
              <aside class="notes">
                <h3>Speaker Notes for Quiz Section</h3>
                <ul>
                  <li>Explain the quiz format and navigation</li>
                  <li>Encourage participants to think carefully about each question</li>
                  <li>Remind them this is a learning opportunity</li>
                  <li>Be prepared to explain correct answers in detail</li>
                </ul>
              </aside>
            </section>
            ${section.quiz_questions ? 
              section.quiz_questions.map((question, index) => `
                <section>
                  <div class="trophy-counter">
                    ${Array(section.quiz_questions.length).fill('🏆').map((trophy, i) => 
                      `<span class="trophy-icon" data-trophy-index="${i}">${trophy}</span>`
                    ).join('')}
                  </div>
                  <h2>Question ${index + 1} of ${section.quiz_questions.length}</h2>
                  <p class="question">${question.question}</p>
                  <ul class="quiz-options" data-correct="${question.options.indexOf(question.correct_answer)}" data-explanation="${question.explanation || ''}" data-question-index="${index}">
                    ${question.options.map((option, optionIndex) => `
                      <li class="quiz-option" data-index="${optionIndex}" onclick="checkAnswer(this)">
                        ${option}
                        <span class="feedback-icon"></span>
                      </li>
                    `).join('\n')}
                  </ul>
                  <div class="feedback-message"></div>
                  <div class="explanation-message"></div>
                  <aside class="notes">
                    <h3>Speaker Notes for Question ${index + 1}</h3>
                    <ul>
                      <li>Question: ${question.question}</li>
                      <li>Correct Answer: ${question.correct_answer}</li>
                      <li>Explanation: ${question.explanation}</li>
                      <li>Additional talking points:</li>
                      <ul>
                        <li>Discuss why other options are incorrect</li>
                        <li>Share relevant examples or scenarios</li>
                        <li>Address common misconceptions</li>
                      </ul>
                    </ul>
                  </aside>
                </section>
              `).join('\n')
            : ''}
          `,
          attributes: {
            'data-transition': 'slide'
          }
        };

      default:
        return {
          content: `
            <section>
              <h2>${section.title}</h2>
            </section>
          `,
          attributes: {
            'data-transition': 'slide'
          }
        };
    }
  }

  public static generateRevealJsHtml(presentation: Presentation, theme: string): string {
    this.log('Starting HTML generation', { theme, sections: presentation.sections.length });

    try {
      // Validate input
      if (!presentation.courseName || !presentation.sections) {
        throw new Error('Invalid presentation data');
      }

      this.log('Generating slides...');
      const slides = [
        this.generateTitleSlide(presentation.courseName),
        ...presentation.sections.map((section, index) => {
          this.log(`Processing section ${index + 1}/${presentation.sections.length}`, {
            type: section.type,
            title: section.title
          });
          return this.generateSectionSlide(section, presentation);
        })
      ];

      this.log('Slides generated successfully');

      // Add debug information to the HTML
      const debugInfo = DEBUG ? `
        <script>
          console.log('[RevealJS Debug] Environment:', {
            url: window.location.href,
            theme: '${theme}',
            presentation: ${JSON.stringify({
              name: presentation.courseName,
              sections: presentation.sections.length
            })}
          });
        </script>
      ` : '';

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${presentation.courseName}</title>
            ${debugInfo}
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reset.css">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.css">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/theme/${theme}.css">
            <style>
              :root {
                --aws-squid-ink: #232F3E;
                --aws-anchor: #003181;
                --aws-smile-orange: #FF9900;
                --aws-raven: #2E3B47;
                --aws-steel: #6A7681;
                --aws-white: #FFFFFF;
                --aws-blue: #0073BB;
                --aws-gradient: linear-gradient(135deg, var(--aws-squid-ink), var(--aws-raven));
                --aws-gradient-accent: linear-gradient(135deg, var(--aws-smile-orange), #FFB84D);
              }
              
              body {
                margin: 0;
                padding: 2rem;
                overflow: hidden;
                background: linear-gradient(135deg, #4B0082, #800080);
                font-family: "Amazon Ember", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                min-height: 100vh;
              }

              .presentation-container {
                display: flex;
                width: 100%;
                gap: 2rem;
                max-width: 1800px;
                margin: 0 auto;
              }

              .presentation-frame {
                flex: 1;
                background: var(--aws-squid-ink);
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                position: relative;
                aspect-ratio: 16 / 9;
                height: calc(100vh - 4rem);
              }

              .reveal {
                position: absolute;
                width: 100%;
                height: 100%;
              }

              .reveal .slides {
                text-align: left;
                width: 90%;
                height: 90%;
                margin: 2rem auto;
              }

              .reveal h1 {
                font-size: 0.8em;
                margin: 0 0 0.4rem 0;
                color: var(--aws-white);
                font-weight: 700;
                letter-spacing: -0.01em;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
              }

              .reveal h1::after {
                content: '';
                position: absolute;
                bottom: -10px;
                left: 0;
                width: 100%;
                height: 4px;
                background: var(--aws-gradient-accent);
                border-radius: 2px;
              }

              .reveal h2 {
                font-size: 0.7em;
                margin: 0 0 0.4rem 0;
                color: var(--aws-white);
                font-weight: 600;
              }

              .reveal h3 {
                font-size: 0.6em;
                margin: 0 0 0.3rem 0;
                color: var(--aws-smile-orange);
                font-weight: 500;
              }

              .metadata-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-top: 1.2rem;
              }

              .metadata-section {
                background: rgba(255, 255, 255, 0.05);
                padding: 1rem;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(8px);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
              }

              .metadata-section:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                border-color: var(--aws-smile-orange);
              }

              .header-line {
                width: 120px;
                height: 4px;
                background: var(--aws-gradient-accent);
                margin: 2rem auto;
                border-radius: 2px;
              }

              .metadata-section ul {
                margin: 0;
                padding-left: 1.2rem;
                list-style-type: none;
              }

              .metadata-section ul li {
                font-size: 0.55em;
                line-height: 1.4;
                color: var(--aws-white);
                margin-bottom: 0.4rem;
                position: relative;
              }

              .metadata-section ul li::before {
                content: '•';
                position: absolute;
                left: -1rem;
                color: var(--aws-smile-orange);
              }

              .metadata-section p {
                font-size: 0.55em;
                line-height: 1.4;
                color: var(--aws-white);
                margin: 0;
              }

              .summary-points, .content-points {
                list-style-type: none;
                padding: 0;
                margin: 0.4rem 0;
                display: grid;
                gap: 0.4rem;
              }

              .summary-points li, .content-points li {
                padding: 0.25rem;
                padding-left: 2.5rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 3px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: var(--aws-white);
                font-size: 0.6em;
                line-height: 1.4;
                position: relative;
              }

              .summary-points li::before, .content-points li::before {
                content: '→';
                position: absolute;
                left: 1.2rem;
                color: var(--aws-smile-orange);
                font-weight: bold;
                margin-right: 0.8rem;
              }

              .summary-points li:hover, .content-points li:hover {
                transform: translateX(2px);
                background: rgba(255, 255, 255, 0.08);
                border-color: var(--aws-smile-orange);
              }

              .question {
                font-size: 0.65em;
                color: var(--aws-white);
                margin-bottom: 1rem;
                line-height: 1.4;
              }

              .quiz-options {
                list-style-type: none;
                padding: 0;
                display: grid;
                gap: 0.8rem;
              }

              .quiz-option {
                padding: 0.7rem;
                padding-left: 2.5rem;
                padding-right: 2.5rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(8px);
                position: relative;
                color: var(--aws-white);
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.6em;
                line-height: 1.4;
              }

              .quiz-option::before {
                content: '○';
                position: absolute;
                left: 1rem;
                color: var(--aws-smile-orange);
                font-weight: bold;
              }

              .quiz-option:hover:not(.answered) {
                transform: translateX(10px);
                background: rgba(255, 255, 255, 0.08);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                border-color: var(--aws-smile-orange);
              }

              .quiz-option.correct {
                background: rgba(76, 175, 80, 0.1);
                border-color: #4CAF50;
              }

              .quiz-option.incorrect {
                background: rgba(244, 67, 54, 0.1);
                border-color: #f44336;
              }

              .quiz-option.answered {
                cursor: default;
                transform: none;
              }

              .feedback-icon {
                position: absolute;
                right: 1rem;
                opacity: 0;
                transition: opacity 0.3s ease;
              }

              .quiz-option.correct .feedback-icon::before {
                content: '✓';
                color: #4CAF50;
                font-weight: bold;
              }

              .quiz-option.incorrect .feedback-icon::before {
                content: '✗';
                color: #f44336;
                font-weight: bold;
              }

              .quiz-option.correct .feedback-icon,
              .quiz-option.incorrect .feedback-icon {
                opacity: 1;
              }

              .feedback-message {
                margin-top: 1rem;
                padding: 1rem;
                border-radius: 8px;
                text-align: center;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s ease;
              }

              .feedback-message.visible {
                opacity: 1;
                transform: translateY(0);
              }

              .feedback-message.correct {
                background: rgba(76, 175, 80, 0.1);
                color: #4CAF50;
                border: 1px solid #4CAF50;
                position: relative;
              }

              .feedback-message.incorrect {
                background: rgba(244, 67, 54, 0.1);
                color: #f44336;
                border: 1px solid #f44336;
              }

              @keyframes trophy-appear {
                0% {
                  transform: translateY(20px) scale(0);
                  opacity: 0;
                }
                60% {
                  transform: translateY(-10px) scale(1.2);
                }
                100% {
                  transform: translateY(0) scale(1);
                  opacity: 1;
                }
              }

              @keyframes trophy-glow {
                0%, 100% {
                  filter: drop-shadow(0 0 5px rgba(255, 223, 0, 0.5));
                }
                50% {
                  filter: drop-shadow(0 0 20px rgba(255, 223, 0, 0.8));
                }
              }

              .trophy {
                position: absolute;
                top: -30px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 2em;
                opacity: 0;
                animation: trophy-appear 0.6s ease forwards,
                           trophy-glow 2s ease-in-out infinite;
                z-index: 1;
              }

              .audio-container {
                margin: 0.4rem auto;
                width: 85%;
                max-width: 800px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid var(--aws-smile-orange);
                border-radius: 3px;
                padding: 0.6rem;
              }

              .audio-wrapper {
                width: 100%;
              }

              .presentation-audio {
                width: 100%;
                height: 40px;
                background: rgba(255, 255, 255, 0.15);
                border-radius: 3px;
                margin-bottom: 0.2rem;
              }

              .presentation-audio::-webkit-media-controls-panel {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
                padding: 5px;
              }

              .presentation-audio::-webkit-media-controls-timeline {
                height: 8px;
                margin: 0 15px;
              }

              .presentation-audio::-webkit-media-controls-current-time-display,
              .presentation-audio::-webkit-media-controls-time-remaining-display {
                color: var(--aws-white);
                font-size: 13px;
                padding: 0 5px;
              }

              .presentation-audio::-webkit-media-controls-play-button,
              .presentation-audio::-webkit-media-controls-mute-button {
                background-color: var(--aws-smile-orange);
                border-radius: 50%;
                width: 32px;
                height: 32px;
                opacity: 0.9;
              }

              .presentation-audio::-webkit-media-controls-play-button:hover,
              .presentation-audio::-webkit-media-controls-mute-button:hover {
                opacity: 1;
                transform: scale(1.05);
              }

              .presentation-audio::-webkit-media-controls-volume-slider {
                width: 80px;
                height: 8px;
                background-color: rgba(255, 255, 255, 0.3);
                border-radius: 3px;
                padding: 2px;
              }

              .presentation-audio::-moz-range-track {
                height: 8px;
                background-color: rgba(255, 255, 255, 0.3);
              }

              .presentation-audio::-moz-range-thumb {
                background-color: var(--aws-smile-orange);
                height: 12px;
                width: 12px;
              }

              .audio-loading-indicator {
                font-size: 0.8em;
                padding: 0.2rem;
              }

              .loading-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid var(--aws-smile-orange);
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }

              @keyframes spin {
                to { transform: rotate(360deg); }
              }

              .audio-error {
                font-size: 0.8em;
                padding: 0.2rem;
              }

              @media (max-width: 1024px) {
                .presentation-container {
                  flex-direction: column;
                }

                .presentation-frame {
                  order: 1;
                  height: 60vh;
                }

                body {
                  padding: 1rem;
                }
              }

              .reveal .progress {
                height: 4px;
                background: rgba(255, 255, 255, 0.1);
              }

              .reveal .progress span {
                background: var(--aws-gradient-accent);
              }

              .reveal .controls {
                color: var(--aws-smile-orange);
              }

              .reveal .controls button {
                transition: all 0.3s ease;
                opacity: 0.7;
              }

              .reveal .controls button:hover {
                color: var(--aws-white);
                transform: scale(1.1);
                opacity: 1;
              }

              .reveal .slide-number {
                background-color: transparent;
                font-size: 14px;
                color: var(--aws-white);
                opacity: 0.7;
              }

              .info-button {
                position: fixed;
                top: 1rem;
                right: 1rem;
                width: 2.5rem;
                height: 2.5rem;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid var(--aws-smile-orange);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 9999;
                color: var(--aws-smile-orange);
                font-size: 1.2rem;
                backdrop-filter: blur(8px);
              }

              .info-button:hover {
                background: rgba(255, 153, 0, 0.2);
                transform: scale(1.1);
                box-shadow: 0 0 20px rgba(255, 153, 0, 0.3);
              }

              .shortcuts-popup {
                position: fixed;
                top: 4rem;
                right: 1rem;
                background: var(--aws-squid-ink);
                backdrop-filter: blur(16px);
                border: 1px solid var(--aws-smile-orange);
                border-radius: 8px;
                padding: 1.5rem;
                width: 300px;
                transform: translateY(-10px);
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                z-index: 9999;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
              }

              .shortcuts-popup.visible {
                transform: translateY(0);
                opacity: 1;
                visibility: visible;
              }

              .shortcuts-popup h3 {
                color: var(--aws-smile-orange);
                font-size: 1.2rem;
                margin-bottom: 1rem;
                border-bottom: 1px solid rgba(255, 153, 0, 0.2);
                padding-bottom: 0.5rem;
              }

              .shortcut-group {
                margin-bottom: 1.5rem;
              }

              .shortcut-group h4 {
                color: var(--aws-white);
                font-size: 0.9rem;
                margin-bottom: 0.8rem;
                opacity: 0.9;
              }

              .shortcut-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.8rem;
                color: var(--aws-white);
                font-size: 0.9rem;
                opacity: 0.8;
              }

              .shortcut-key {
                background: rgba(255, 153, 0, 0.1);
                padding: 0.3rem 0.6rem;
                border-radius: 4px;
                font-family: monospace;
                font-size: 0.8rem;
                color: var(--aws-smile-orange);
                border: 1px solid rgba(255, 153, 0, 0.2);
              }

              .vertical-nav-hint {
                position: fixed;
                bottom: 6rem;
                left: 50%;
                transform: translateX(-50%);
                text-align: center;
                cursor: pointer;
                padding: 0.8rem 1.5rem;
                border-radius: 8px;
                background: var(--aws-squid-ink);
                border: 2px solid var(--aws-smile-orange);
                transition: all 0.3s ease;
                z-index: 1000;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(8px);
              }

              .vertical-nav-hint:hover {
                background: rgba(35, 47, 62, 0.95);
                transform: translateX(-50%) translateY(-2px);
                box-shadow: 0 6px 24px rgba(255, 153, 0, 0.2);
              }

              .vertical-nav-hint p {
                color: var(--aws-white);
                margin: 0;
                font-size: 1rem;
                font-weight: 500;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                line-height: 1.4;
              }

              @keyframes bounce {
                0%, 20%, 50%, 80%, 100% {
                  transform: translateX(-50%) translateY(0);
                }
                40% {
                  transform: translateX(-50%) translateY(-8px);
                }
                60% {
                  transform: translateX(-50%) translateY(-4px);
                }
              }

              .vertical-nav-hint.with-animation {
                animation: bounce 2s infinite;
              }

              @media (max-width: 768px) {
                .vertical-nav-hint {
                  bottom: 5rem;
                  padding: 0.6rem 1.2rem;
                }

                .vertical-nav-hint p {
                  font-size: 0.9rem;
                }
              }

              .explanation-message {
                margin-top: 0.8rem;
                padding: 0.8rem;
                border-radius: 6px;
                text-align: left;
                opacity: 0;
                transform: translateY(-8px);
                transition: all 0.3s ease;
                background: rgba(255, 153, 0, 0.1);
                color: var(--aws-white);
                border: 1px solid var(--aws-smile-orange);
                display: none;
                font-size: 0.7em;
                line-height: 1.4;
              }

              .explanation-message.visible {
                opacity: 1;
                transform: translateY(0);
                display: block;
              }

              .explanation-message::before {
                content: '💡 Explanation:';
                display: block;
                color: var(--aws-smile-orange);
                font-weight: bold;
                margin-bottom: 0.5rem;
                font-size: 1.2em;
              }

              .trophy-counter {
                position: fixed;
                top: 1rem;
                right: 4rem;
                display: flex;
                gap: 0.2rem;
                z-index: 1000;
              }

              .trophy-icon {
                font-size: 1.5rem;
                opacity: 0.3;
                transition: all 0.3s ease;
              }

              .trophy-icon.earned {
                opacity: 1;
                animation: trophy-pop 0.5s ease forwards;
              }

              @keyframes trophy-pop {
                0% {
                  transform: scale(0.8);
                }
                50% {
                  transform: scale(1.2);
                }
                100% {
                  transform: scale(1);
                }
              }

              /* Add fullscreen button styles */
              .fullscreen-button {
                position: fixed;
                top: 1rem;
                right: 5rem;  /* Position it next to the info button */
                width: 2.5rem;
                height: 2.5rem;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid var(--aws-smile-orange);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 9999;
                color: var(--aws-smile-orange);
                font-size: 1.2rem;
                backdrop-filter: blur(8px);
              }

              .fullscreen-button:hover {
                background: rgba(255, 153, 0, 0.2);
                transform: scale(1.1);
                box-shadow: 0 0 20px rgba(255, 153, 0, 0.3);
              }

              .fullscreen .reveal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 9999;
                background: var(--aws-squid-ink);
              }
            </style>
          </head>
          <body>
            <div class="presentation-container">
              <div class="presentation-frame">
                <div class="reveal">
                  <div class="slides">
                    ${slides.map(slide => `
                      <section ${Object.entries(slide.attributes || {})
                        .map(([key, value]) => `${key}="${value}"`)
                        .join(' ')}>
                        ${slide.content}
                      </section>
                    `).join('\n')}
                  </div>
                </div>
              </div>
            </div>

            <!-- Info button and shortcuts popup -->
            <div class="info-button" id="infoButton">?</div>
            <div class="fullscreen-button" id="fullscreenButton">⛶</div>
            <div class="shortcuts-popup" id="shortcutsPopup">
              <h3>Presentation Controls</h3>
              
              <div class="shortcut-group">
                <h4>Navigation</h4>
                <div class="shortcut-item">
                  <span>Next slide</span>
                  <span class="shortcut-key">→ / Space</span>
                </div>
                <div class="shortcut-item">
                  <span>Previous slide</span>
                  <span class="shortcut-key">←</span>
                </div>
              </div>

              <div class="shortcut-group">
                <h4>View Controls</h4>
                <div class="shortcut-item">
                  <span>Overview mode</span>
                  <span class="shortcut-key">O</span>
                </div>
                <div class="shortcut-item">
                  <span>Fullscreen</span>
                  <span class="shortcut-key">F</span>
                </div>
                <div class="shortcut-item">
                  <span>Toggle menu</span>
                  <span class="shortcut-key">M</span>
                </div>
              </div>

              <div class="shortcut-group">
                <h4>Other Controls</h4>
                <div class="shortcut-item">
                  <span>Help</span>
                  <span class="shortcut-key">?</span>
                </div>
                <div class="shortcut-item">
                  <span>Zoom</span>
                  <span class="shortcut-key">Alt + Click</span>
                </div>
              </div>
            </div>

            <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.js"></script>
            <script>
              console.log('[RevealJS] Starting initialization...');
              
              // Info button functionality
              document.getElementById('infoButton').addEventListener('click', (e) => {
                e.stopPropagation();
                const popup = document.getElementById('shortcutsPopup');
                popup.classList.toggle('visible');
              });

              // Close popup when clicking outside
              document.addEventListener('click', (e) => {
                if (!e.target.closest('.shortcuts-popup') && !e.target.closest('.info-button')) {
                  document.getElementById('shortcutsPopup').classList.remove('visible');
                }
              });

              // Fullscreen functionality
              document.getElementById('fullscreenButton').addEventListener('click', () => {
                const presentationFrame = document.querySelector('.presentation-frame');
                if (!document.fullscreenElement) {
                  if (presentationFrame.requestFullscreen) {
                    presentationFrame.requestFullscreen();
                  } else if (presentationFrame.webkitRequestFullscreen) {
                    presentationFrame.webkitRequestFullscreen();
                  } else if (presentationFrame.msRequestFullscreen) {
                    presentationFrame.msRequestFullscreen();
                  }
                  document.body.classList.add('fullscreen');
                } else {
                  if (document.exitFullscreen) {
                    document.exitFullscreen();
                  } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                  } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                  }
                  document.body.classList.remove('fullscreen');
                }
              });

              // Update fullscreen button on fullscreen change
              document.addEventListener('fullscreenchange', () => {
                const fullscreenButton = document.getElementById('fullscreenButton');
                if (document.fullscreenElement) {
                  fullscreenButton.innerHTML = '⛶';
                } else {
                  fullscreenButton.innerHTML = '⛶';
                }
              });

              // Test audio - base64 encoded 1-second silence WAV file
              const TEST_AUDIO_BASE64 = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

              // Function to test audio playback with a simple WAV file
              window.testAudioPlayback = function(button) {
                const container = button.closest('.audio-container');
                const audio = container.querySelector('audio');
                const errorDiv = container.querySelector('.audio-error');
                
                if (!audio) return;
                
                // Hide any previous error
                if (errorDiv) errorDiv.style.display = 'none';
                
                // Create a test audio source from base64
                const testAudioUrl = 'data:audio/wav;base64,' + TEST_AUDIO_BASE64;
                
                console.log('[Audio Test] Testing audio playback with base64 WAV');
                
                // Set the source and attempt to play
                audio.src = testAudioUrl;
                audio.play().then(() => {
                  console.log('[Audio Test] Test audio played successfully');
                  button.textContent = 'Test Successful';
                  button.style.backgroundColor = '#4CAF50';
                }).catch(error => {
                  console.error('[Audio Test] Test audio failed:', error);
                  button.textContent = 'Test Failed';
                  button.style.backgroundColor = '#f44336';
                  if (errorDiv) {
                    errorDiv.style.display = 'block';
                    errorDiv.innerHTML = '<p>Audio test failed. Please check your browser settings.</p>';
                  }
                });
              };

              // Function to load the actual audio file
              window.loadActualAudio = function(button) {
                const container = button.closest('.audio-container');
                const audio = container.querySelector('audio');
                const errorDiv = container.querySelector('.audio-error');
                const loadingIndicator = container.querySelector('.audio-loading-indicator');
                
                // Helper function to show errors
                function showError(message) {
                  if (!errorDiv) return;
                  errorDiv.style.display = 'block';
                  errorDiv.innerHTML = '<p>' + message + '</p>';
                  button.textContent = 'Load Failed';
                  button.style.backgroundColor = '#f44336';
                  if (loadingIndicator) loadingIndicator.style.display = 'none';
                }

                if (!audio || !audio.dataset.course || !audio.dataset.filename) {
                  console.error('[Audio] Missing required data attributes');
                  showError('Missing required audio data attributes');
                  return;
                }
                
                const courseName = audio.dataset.course;
                const filename = audio.dataset.filename;
                
                // Reset UI state
                if (errorDiv) errorDiv.style.display = 'none';
                if (loadingIndicator) loadingIndicator.style.display = 'block';
                button.textContent = 'Loading...';
                button.style.backgroundColor = '#FFA500';
                
                console.log('[Audio] Attempting to load audio:', {
                  courseName,
                  filename,
                  baseURI: document.baseURI
                });

                // Use the local assets path instead of the API endpoint
                const audioPath = '/src/assets/audio/' + courseName + '/' + filename;
                console.log('[Audio] Using local path:', audioPath);

                // Set the audio source directly
                audio.src = audioPath;

                // Set up a timeout to check if the audio loads
                return new Promise(function(resolve, reject) {
                  const timeout = setTimeout(function() {
                    reject(new Error('Audio loading timed out'));
                  }, 10000);
                  
                  audio.onloadeddata = function() {
                    clearTimeout(timeout);
                    console.log('[Audio] Audio loaded successfully');
                    button.textContent = 'Audio Loaded';
                    button.style.backgroundColor = '#4CAF50';
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    resolve(true);
                  };
                  
                  audio.onerror = function(e) {
                    clearTimeout(timeout);
                    console.error('[Audio] Error loading audio:', e);
                    button.textContent = 'Load Failed';
                    button.style.backgroundColor = '#f44336';
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    reject(new Error('Failed to load audio file. Please check if the file exists and try again.'));
                  };
                }).catch(function(error) {
                  console.error('[Audio] Loading failed:', error);
                  showError(error.message);
                });
              };

              function initReveal() {
                try {
                  if (typeof window.Reveal === 'undefined') {
                    console.error('[RevealJS] Reveal is not defined!');
                    window.parent.postMessage('revealError', '*');
                    return;
                  }

                  const deck = new window.Reveal({
                    controls: true,
                    progress: true,
                    center: true,
                    hash: true,
                    width: '100%',
                    height: '100%',
                    margin: 0.15,
                    minScale: 0.2,
                    maxScale: 2.0,
                    transition: 'slide',
                    backgroundTransition: 'fade',
                    controlsTutorial: true,
                    controlsLayout: 'edges',
                    controlsBackArrows: 'visible',
                    slideNumber: 'c/t',
                    touch: true,
                    hideInactiveCursor: true,
                    hideCursorTime: 3000,
                    autoSlide: 5000,
                    autoSlideStoppable: true,
                    autoSlideMethod: null,
                    loop: false,
                    autoSlideOnFocus: false,
                    pauseAutoSlideOnHover: true,
                    keyboard: {
                      32: 'next',
                      13: 'next',
                      27: null,
                      79: () => deck.toggleOverview(),
                      70: () => {
                        const element = document.documentElement;
                        if (element.requestFullscreen) {
                          !document.fullscreenElement ? element.requestFullscreen() : document.exitFullscreen();
                        }
                      },
                      77: () => {},
                      191: () => {
                        document.getElementById('shortcutsPopup')?.classList.toggle('visible');
                      }
                    },
                    plugins: []
                  });

                  deck.initialize().then(() => {
                    console.log('[RevealJS] Initialization successful');
                    window.parent.postMessage('revealReady', '*');

                    // Handle section navigation messages
                    window.addEventListener('message', (event) => {
                      if (event.data?.type === 'navigateToSection') {
                        const index = event.data.index;
                        deck.slide(index);
                      }
                    });

                    // Send section change events to parent
                    deck.on('slidechanged', (event) => {
                      const currentIndex = event.indexh;
                      window.parent.postMessage({ 
                        type: 'sectionChanged', 
                        index: currentIndex 
                      }, '*');

                      // Update section navigation active state
                      document.querySelectorAll('.section-item').forEach(function(item) {
                        const itemIndex = parseInt(item.dataset.sectionIndex || '0');
                        item.classList.toggle('active', itemIndex === currentIndex);
                      });
                    });

                  }).catch(error => {
                    console.error('[RevealJS] Initialization failed:', error);
                    window.parent.postMessage('revealError', '*');
                  });
                } catch (error) {
                  console.error('[RevealJS] Error in setup:', error);
                  window.parent.postMessage('revealError', '*');
                }
              }

              // Initialize when everything is loaded
              if (document.readyState === 'complete') {
                initReveal();
              } else {
                window.addEventListener('load', initReveal);
              }

              // Audio functionality
              document.addEventListener('DOMContentLoaded', function() {
                const audioElements = document.querySelectorAll('.presentation-audio');
                
                audioElements.forEach(audio => {
                  // Set up auto-slide duration when audio metadata is loaded
                  audio.addEventListener('loadedmetadata', function() {
                    const section = this.closest('section');
                    if (section) {
                      const durationMs = Math.ceil(this.duration * 1000);
                      section.dataset.autoslide = durationMs;
                      console.log('[Audio] Set auto-slide duration:', {
                        slide: section.querySelector('h2')?.textContent,
                        duration: durationMs + 'ms'
                      });
                    }
                  });

                  audio.addEventListener('error', function(e) {
                    console.error('[Audio] Error loading audio:', e);
                    const container = this.closest('.audio-container');
                    if (container) {
                      container.querySelector('.audio-error').style.display = 'block';
                      container.querySelector('.audio-loading-indicator').style.display = 'none';
                    }
                  });

                  audio.addEventListener('loadstart', function() {
                    const container = this.closest('.audio-container');
                    if (container) {
                      container.querySelector('.audio-loading-indicator').style.display = 'block';
                    }
                  });

                  audio.addEventListener('canplay', function() {
                    const container = this.closest('.audio-container');
                    if (container) {
                      container.querySelector('.audio-loading-indicator').style.display = 'none';
                    }
                  });
                });

                // Handle slide changes
                if (window.Reveal) {
                  window.Reveal.on('slidechanged', function(event) {
                    // Pause all audio when changing slides
                    document.querySelectorAll('audio').forEach(audio => {
                      audio.pause();
                      audio.currentTime = 0;
                    });

                    // Auto-play audio on the current slide if it exists
                    const currentSlide = event.currentSlide;
                    const audio = currentSlide.querySelector('audio[data-autoplay]');
                    if (audio) {
                      // Reset auto-slide timer when audio starts playing
                      const durationMs = Math.ceil(audio.duration * 1000);
                      currentSlide.dataset.autoslide = durationMs;
                      
                      audio.play().catch(error => {
                        console.warn('[Audio] Autoplay failed:', error);
                        const container = audio.closest('.audio-container');
                        if (container) {
                          container.querySelector('.audio-error').style.display = 'block';
                          container.querySelector('.audio-loading-indicator').style.display = 'none';
                        }
                      });
                    }
                  });
                }
              });

              // Quiz functionality
              function checkAnswer(optionElement) {
                const optionsList = optionElement.closest('.quiz-options');
                const feedbackMessage = optionElement.closest('section').querySelector('.feedback-message');
                const explanationMessage = optionElement.closest('section').querySelector('.explanation-message');
                
                // If already answered, do nothing
                if (optionsList.classList.contains('answered')) return;
                
                const correctAnswer = parseInt(optionsList.dataset.correct);
                const selectedAnswer = parseInt(optionElement.dataset.index);
                const isCorrect = selectedAnswer === correctAnswer;
                const explanation = optionsList.dataset.explanation;
                const questionIndex = parseInt(optionsList.dataset.questionIndex);
                
                console.log('[Quiz] Answer check:', {
                  selected: selectedAnswer,
                  correct: correctAnswer,
                  isCorrect: isCorrect,
                  questionIndex: questionIndex
                });
                
                // Mark all options as answered to prevent further selection
                optionsList.classList.add('answered');
                
                // Add appropriate classes for styling
                optionElement.classList.add(isCorrect ? 'correct' : 'incorrect');
                
                // If selected wrong answer, also highlight the correct one
                if (!isCorrect) {
                  optionsList.children[correctAnswer].classList.add('correct');
                }
                
                // Show feedback message
                feedbackMessage.textContent = isCorrect ? 
                  'Correct! Well done!' : 
                  'Incorrect. The correct answer is highlighted in green.';
                feedbackMessage.classList.add('visible', isCorrect ? 'correct' : 'incorrect');
                
                // Update trophy counter if answer is correct
                if (isCorrect) {
                  const trophyIcons = document.querySelectorAll('.trophy-icon');
                  trophyIcons.forEach(icon => {
                    if (parseInt(icon.dataset.trophyIndex) === questionIndex) {
                      icon.classList.add('earned');
                    }
                  });
                }
                
                // Show explanation only for correct answer
                if (isCorrect && explanation) {
                  explanationMessage.textContent = explanation;
                  explanationMessage.classList.add('visible');
                }
                
                // Apply answered state to all options
                Array.from(optionsList.children).forEach(option => {
                  option.classList.add('answered');
                });
              }

              // Add navigation function
              function navigateToSection(index) {
                const deck = window.Reveal;
                if (deck) {
                  deck.slide(index);
                  
                  // Update active state in navigation
                  document.querySelectorAll('.section-item').forEach(function(item) {
                    item.classList.remove('active');
                  });
                  const activeSection = document.querySelector('.section-item[data-section-index="' + index + '"]');
                  if (activeSection) {
                    activeSection.classList.add('active');
                  }
                }
              }

              // Update navigation on slide change
              if (window.Reveal) {
                window.Reveal.on('slidechanged', function(event) {
                  const currentIndex = event.indexh;
                  document.querySelectorAll('.section-item').forEach(function(item) {
                    const itemIndex = parseInt(item.dataset.sectionIndex || '0');
                    item.classList.toggle('active', itemIndex === currentIndex);
                  });
                });
              }
            </script>
          </body>
        </html>
      `;

      return html;
    } catch (error) {
      this.error('Error generating Reveal.js HTML', error);
      throw error; // Re-throw the error after logging
    }
  }
}