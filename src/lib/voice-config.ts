export interface VoiceConfig {
  voice: string;
  style: string;
  language: string;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  voiceConfig: VoiceConfig;
  sampleAudioUrl: string;
}

export interface LanguageConfig {
  id: string;
  name: string;
  code: string;
  personas: Persona[];
}

export const languageConfigs: LanguageConfig[] = [
  {
    id: 'english-us',
    name: 'English (United States)',
    code: 'en-US',
    personas: [
      {
        id: 'andrew',
        name: 'Andrew (Male)',
        description: 'Professional and articulate expert voice',
        voiceConfig: {
          voice: 'en-US-AndrewMultilingualNeural',
          style: 'professional',
          language: 'en-US'
        },
        sampleAudioUrl: '/audio-samples/en-US-AndrewMultilingualNeural.mp3'
      },
      {
        id: 'guy',
        name: 'Guy (Male)',
        description: 'Clear and confident technical expert',
        voiceConfig: {
          voice: 'en-US-GuyNeural',
          style: 'professional',
          language: 'en-US'
        },
        sampleAudioUrl: '/audio-samples/en-US-GuyNeural.mp3'
      },
      {
        id: 'ava',
        name: 'Ava (Female)',
        description: 'Friendly and engaging learner voice',
        voiceConfig: {
          voice: 'en-US-AvaMultilingualNeural',
          style: 'friendly',
          language: 'en-US'
        },
        sampleAudioUrl: '/audio-samples/en-US-AvaMultilingualNeural.mp3'
      },
      {
        id: 'jenny',
        name: 'Jenny (Female)',
        description: 'Enthusiastic and curious learner',
        voiceConfig: {
          voice: 'en-US-JennyNeural',
          style: 'friendly',
          language: 'en-US'
        },
        sampleAudioUrl: '/audio-samples/en-US-JennyNeural.mp3'
      }
    ]
  },
  {
    id: 'english-gb',
    name: 'English (United Kingdom)',
    code: 'en-GB',
    personas: [
      {
        id: 'ryan',
        name: 'Ryan (Male)',
        description: 'Professional British expert voice',
        voiceConfig: {
          voice: 'en-GB-RyanMultilingualNeural',
          style: 'professional',
          language: 'en-GB'
        },
        sampleAudioUrl: '/audio-samples/en-GB-RyanMultilingualNeural.mp3'
      },
      {
        id: 'sonia',
        name: 'Sonia (Female)',
        description: 'Friendly British learner voice',
        voiceConfig: {
          voice: 'en-GB-SoniaNeural',
          style: 'friendly',
          language: 'en-GB'
        },
        sampleAudioUrl: '/audio-samples/en-GB-SoniaNeural.mp3'
      }
    ]
  },
  {
    id: 'german-de',
    name: 'German (Germany)',
    code: 'de-DE',
    personas: [
      {
        id: 'killian',
        name: 'Killian (Male)',
        description: 'Professional German expert voice',
        voiceConfig: {
          voice: 'de-DE-KillianNeural',
          style: 'professional',
          language: 'de-DE'
        },
        sampleAudioUrl: '/audio-samples/de-DE-KillianNeural.mp3'
      },
      {
        id: 'maja',
        name: 'Maja (Female)',
        description: 'Friendly German learner voice',
        voiceConfig: {
          voice: 'de-DE-MajaNeural',
          style: 'friendly',
          language: 'de-DE'
        },
        sampleAudioUrl: '/audio-samples/de-DE-MajaNeural.mp3'
      }
    ]
  },
  {
    id: 'german-ch',
    name: 'German (Switzerland)',
    code: 'de-CH',
    personas: [
      {
        id: 'jan',
        name: 'Jan (Male)',
        description: 'Professional Swiss German expert voice',
        voiceConfig: {
          voice: 'de-CH-JanNeural',
          style: 'professional',
          language: 'de-CH'
        },
        sampleAudioUrl: '/audio-samples/de-CH-JanNeural.mp3'
      },
      {
        id: 'leni',
        name: 'Leni (Female)',
        description: 'Friendly Swiss German learner voice',
        voiceConfig: {
          voice: 'de-CH-LeniNeural',
          style: 'friendly',
          language: 'de-CH'
        },
        sampleAudioUrl: '/audio-samples/de-CH-LeniNeural.mp3'
      }
    ]
  },
  {
    id: 'french-fr',
    name: 'French (France)',
    code: 'fr-FR',
    personas: [
      {
        id: 'henri',
        name: 'Henri (Male)',
        description: 'Professional French expert voice',
        voiceConfig: {
          voice: 'fr-FR-HenriNeural',
          style: 'professional',
          language: 'fr-FR'
        },
        sampleAudioUrl: '/audio-samples/fr-FR-HenriNeural.mp3'
      },
      {
        id: 'denise',
        name: 'Denise (Female)',
        description: 'Friendly French learner voice',
        voiceConfig: {
          voice: 'fr-FR-DeniseNeural',
          style: 'friendly',
          language: 'fr-FR'
        },
        sampleAudioUrl: '/audio-samples/fr-FR-DeniseNeural.mp3'
      }
    ]
  },
  {
    id: 'french-ch',
    name: 'French (Switzerland)',
    code: 'fr-CH',
    personas: [
      {
        id: 'fabrice',
        name: 'Fabrice (Male)',
        description: 'Professional Swiss French expert voice',
        voiceConfig: {
          voice: 'fr-CH-FabriceNeural',
          style: 'professional',
          language: 'fr-CH'
        },
        sampleAudioUrl: '/audio-samples/fr-CH-FabriceNeural.mp3'
      },
      {
        id: 'ariane',
        name: 'Ariane (Female)',
        description: 'Friendly Swiss French learner voice',
        voiceConfig: {
          voice: 'fr-CH-ArianeNeural',
          style: 'friendly',
          language: 'fr-CH'
        },
        sampleAudioUrl: '/audio-samples/fr-CH-ArianeNeural.mp3'
      }
    ]
  }
]; 