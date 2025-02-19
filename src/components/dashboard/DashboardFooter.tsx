
import React from 'react';

export const DashboardFooter = () => {
  return (
    <footer className="border-t border-gray-800 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">© 2025 AI-Buddy. All rights reserved.</span>
            <span className="text-gray-600">•</span>
            <span className="text-sm text-gray-400">Version 2.0.0</span>
          </div>
          <p className="text-sm text-gray-400">Created by Vijay Betigiri (vijay.betigiri@swisscom.com)</p>
        </div>
      </div>
    </footer>
  );
};
