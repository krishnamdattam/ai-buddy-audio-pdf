
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Headphones, Video, Trash2, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface CourseCardProps {
  courseName: string;
  progress?: number;
  createdDate?: string;
  lastAccessed?: string;
}

export const CourseCard = ({
  courseName,
  progress = 75,
  createdDate = "05.02.2025",
  lastAccessed = "13.02.2025"
}: CourseCardProps) => {
  const navigate = useNavigate();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/course-canvas', { state: { courseName } });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.error("Delete functionality coming soon!");
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="group"
    >
      <Card 
        className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
        onClick={() => navigate('/course-canvas', { state: { courseName } })}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BookOpen className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium text-white group-hover:text-purple-400 transition-colors line-clamp-1">
                  {courseName}
                </h3>
                <p className="text-sm text-gray-400 mt-1">Course Progress</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
              >
                <Headphones className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
              >
                <Video className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Created {createdDate}</span>
              <span>Accessed {lastAccessed}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
