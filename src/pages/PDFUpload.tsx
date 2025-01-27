import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import PDFUpload from '@/components/PDFUpload';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PDFUploadPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { courseName, template, persona } = location.state || {};

  const handleFileSelect = (file: File) => {
    console.log('Selected file:', file);
    // Handle file upload logic here
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white">
              Upload PDF for {courseName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-6">
              Upload a PDF document to create your personalized course content.
              We'll use {template} format with {persona} personas.
            </p>
            <PDFUpload onFileSelect={handleFileSelect} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PDFUploadPage;