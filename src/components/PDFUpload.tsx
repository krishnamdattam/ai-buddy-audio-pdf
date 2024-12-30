import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface PDFUploadProps {
  onFileSelect: (file: File) => void;
}

const PDFUpload = ({ onFileSelect }: PDFUploadProps) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div className="p-4 border-2 border-dashed rounded-lg bg-white">
      <label className="flex flex-col items-center justify-center cursor-pointer">
        <Upload className="w-8 h-8 text-primary mb-2" />
        <span className="text-sm font-medium text-gray-600">Upload PDF</span>
        <input
          type="file"
          className="hidden"
          accept=".pdf"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

export default PDFUpload;