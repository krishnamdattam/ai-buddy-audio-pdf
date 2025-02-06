import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to generate consistent file names
export function generateSafeFileName(originalName: string, type: 'course' | 'audio' | 'pdf' | 'json'): string {
  // Remove special characters and spaces, convert to lowercase
  const baseName = originalName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')  // Replace non-alphanumeric chars with underscore
    .replace(/_+/g, '_')         // Replace multiple underscores with single
    .replace(/^_|_$/g, '');      // Remove leading/trailing underscores

  // Add timestamp for uniqueness
  const timestamp = new Date().getTime();
  
  // Generate appropriate extension based on type
  switch (type) {
    case 'course':
      return baseName;
    case 'audio':
      return `${baseName}_${timestamp}.wav`;
    case 'pdf':
      return `${baseName}_${timestamp}.pdf`;
    case 'json':
      return `${baseName}_${timestamp}.json`;
    default:
      return baseName;
  }
}

// Function to generate consistent section file names
export function generateSectionFileName(courseName: string, sectionTitle: string, sectionIndex: number): string {
  const safeCourseName = courseName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const safeSectionTitle = sectionTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  return `${safeCourseName}_${sectionIndex + 1}__${safeSectionTitle}`;
}

// Function to parse course name from file name
export function parseFileNameInfo(fileName: string): {
  courseName: string;
  timestamp: string;
  type: string;
} {
  const parts = fileName.split('_');
  const timestamp = parts[parts.length - 1].split('.')[0];
  const type = parts[parts.length - 1].split('.')[1];
  const courseName = parts.slice(0, -1).join('_');
  
  return {
    courseName,
    timestamp,
    type
  };
}

// Function to check if files belong to the same course
export function areFilesFromSameCourse(fileNames: string[]): boolean {
  if (fileNames.length === 0) return true;
  
  const firstCourseName = parseFileNameInfo(fileNames[0]).courseName;
  return fileNames.every(fileName => 
    parseFileNameInfo(fileName).courseName === firstCourseName
  );
}
