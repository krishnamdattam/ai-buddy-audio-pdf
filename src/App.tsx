import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import VideoPlayer from '@/pages/VideoPlayer';
import Dashboard from '@/pages/Dashboard';
import SignIn from '@/pages/SignIn';
import Index from '@/pages/Index';
import CourseCanvas from '@/pages/CourseCanvas';
import Landing from '@/pages/Landing';
import PresentationCanvas from '@/pages/PresentationCanvas';
import PublishedPresentation from '@/pages/PublishedPresentation';
import PublishedAvatarPresentation from '@/pages/PublishedAvatarPresentation';
import SimplifiedPresentation from '@/pages/SimplifiedPresentation';
import CourseGenerator from '@/pages/CourseGenerator';
import { Toaster } from 'sonner';

const App: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/index" element={<Index />} />
        <Route path="/course-canvas" element={<CourseCanvas />} />
        <Route path="/presentation-canvas" element={<PresentationCanvas />} />
        <Route path="/video-player" element={<VideoPlayer />} />
        <Route path="/published-presentation" element={<PublishedPresentation />} />
        <Route path="/published-avatar-presentation" element={<PublishedAvatarPresentation />} />
        <Route path="/simplified-presentation/:presentationId?" element={<SimplifiedPresentation />} />
        <Route path="/course-generator" element={<CourseGenerator />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </>
  );
};

export default App;