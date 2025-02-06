import React, { useState, useRef } from 'react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

interface Conversation {
  role: string;
  content: string;
}

const sampleConversation: Conversation[] = [
  {
    role: 'Expert',
    content: 'Hi, Hello!',
  },
  {
    role: 'Learner',
    content: 'Hello Sir, I want to learn Python.',
  },
  {
    role: 'Expert',
    content: 'That\'s great! Python is an excellent programming language to start with.',
  },
];

const SpeechConversation: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const audioElements = useRef<HTMLAudioElement[]>([]);

  const saveAudioToServer = async (audioBlob: Blob, filename: string) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('filename', filename);

    try {
      const response = await fetch('http://localhost:5001/api/save-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save audio file');
      }

      const data = await response.json();
      return data.filepath;
    } catch (error) {
      console.error('Error saving audio file:', error);
      throw error;
    }
  };

  const playConversation = async () => {
    setIsPlaying(true);
    const newAudioUrls: string[] = [];
    
    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        import.meta.env.VITE_AZURE_SPEECH_KEY || '',
        import.meta.env.VITE_AZURE_SPEECH_REGION || ''
      );
      
      speechConfig.speechSynthesisVoiceName = 'en-US-JennyNeural';

      for (let i = 0; i < sampleConversation.length; i++) {
        const message = sampleConversation[i];
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
        
        try {
          const result = await new Promise<sdk.SpeechSynthesisResult>((resolve, reject) => {
            synthesizer.speakTextAsync(
              message.content,
              result => {
                synthesizer.close();
                resolve(result);
              },
              error => {
                synthesizer.close();
                reject(error);
              }
            );
          });

          // Convert the audio data to a Blob
          const audioBlob = new Blob([result.audioData], { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          newAudioUrls.push(audioUrl);

          // Save the file to the server
          const filename = `conversation_part_${i + 1}.wav`;
          await saveAudioToServer(audioBlob, filename);

        } catch (error) {
          console.error(`Error synthesizing speech for message ${i + 1}:`, error);
        }

        // Add a small pause between messages
        if (i < sampleConversation.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setAudioUrls(newAudioUrls);
    } catch (error) {
      console.error('Error playing conversation:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  const playAudioSequentially = async () => {
    for (let i = 0; i < audioElements.current.length; i++) {
      const audio = audioElements.current[i];
      if (audio) {
        try {
          await new Promise((resolve, reject) => {
            audio.onended = resolve;
            audio.onerror = reject;
            audio.play();
          });
        } catch (error) {
          console.error(`Error playing audio ${i + 1}:`, error);
        }
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Sample Conversation
        </h1>
        
        <div className="space-y-4">
          {sampleConversation.map((message, index) => (
            <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
              <div className="flex flex-col">
                <span className={`font-semibold ${
                  message.role === 'Expert' ? 'text-blue-600' : 'text-purple-600'
                }`}>
                  {message.role}
                </span>
                <span className="text-gray-700 mt-1">
                  {message.content}
                </span>
                {audioUrls[index] && (
                  <audio
                    ref={el => el && (audioElements.current[index] = el)}
                    src={audioUrls[index]}
                    controls
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={playConversation}
            disabled={isPlaying}
            className={`px-6 py-2 rounded-md text-white font-medium
              ${isPlaying 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              } transition-colors duration-200`}
          >
            {isPlaying ? 'Generating...' : 'Generate Audio'}
          </button>
          {audioUrls.length > 0 && (
            <button
              onClick={playAudioSequentially}
              className="px-6 py-2 rounded-md text-white font-medium bg-green-600 hover:bg-green-700 active:bg-green-800 transition-colors duration-200"
            >
              Play All
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeechConversation; 