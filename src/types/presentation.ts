export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface SectionMetadata {
  prerequisites: string[];
  learningGoals: string[];
  estimatedTime: string;
}

export interface LogoStyle {
  maxHeight: string;
  margin: string;
  position: 'absolute';
  top: string;
  left: string;
  zIndex: string;
}

export interface LogoConfig {
  src: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  style: LogoStyle;
}

export interface PresentationConfig {
  logo?: LogoConfig;
}

export interface Section {
  title: string;
  type: 'welcome' | 'overview' | 'section_header' | 'section_metadata' | 'content' | 'quiz';
  summary_points?: string[];
  is_quiz?: boolean;
  quiz_questions?: QuizQuestion[];
  metadata?: SectionMetadata;
  audio_url?: string;
}

export interface Presentation {
  courseName: string;
  presentationConfig?: PresentationConfig;
  sections: Section[];
} 