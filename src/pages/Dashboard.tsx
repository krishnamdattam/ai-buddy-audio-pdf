import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  // Placeholder data for courses
  const courses = [
    {
      id: 1,
      title: 'Introduction to AI',
      createdAt: '2024-03-15',
    },
    {
      id: 2,
      title: 'Machine Learning Basics',
      createdAt: '2024-03-14',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                AI-Buddy
              </h1>
            </div>
            <nav className="flex items-center space-x-4">
              <a href="/dashboard" className="text-gray-300 hover:text-white px-3 py-2">
                Dashboard
              </a>
              <a href="/help" className="text-gray-300 hover:text-white px-3 py-2">
                Help
              </a>
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-sm">U</span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create New Course Button */}
        <div className="mb-8">
          <Button
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => console.log('Create new course')}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Create a New Personalised Course
          </Button>
        </div>

        {/* Existing Courses */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Existing Personalised Courses for you</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-white">
                    {course.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 mb-4">
                    Created on {new Date(course.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                      onClick={() => console.log('Edit course', course.id)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-400 border-red-400 hover:bg-red-400/10"
                      onClick={() => console.log('Delete course', course.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-400 text-sm">
            <p>&copy; 2024 AI-Buddy. All rights reserved.</p>
            <p>Version 1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
