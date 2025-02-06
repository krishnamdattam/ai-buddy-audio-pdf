import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import VideoPlayer from '@/pages/VideoPlayer';
import Dashboard from '@/pages/Dashboard';
import SignIn from '@/pages/SignIn';
import Index from '@/pages/Index';
import CourseCanvas from '@/pages/CourseCanvas';
import Landing from '@/pages/Landing';
import { Toaster } from 'sonner';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/video-player" element={<VideoPlayer />} />
        <Route path="/index" element={<Index />} />
        <Route path="/audio" element={<Index />} />
        <Route path="/course-canvas" element={<CourseCanvas />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </Router>
  );
}

export default App;