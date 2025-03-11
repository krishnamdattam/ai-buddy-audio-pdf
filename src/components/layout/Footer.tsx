const Footer = () => {
  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm z-40">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">© 2025 AI-Buddy. All rights reserved.</span>
              <span className="text-gray-600">•</span>
              <span className="text-sm text-gray-400">Version 0.0.9</span>
            </div>
            <p className="text-sm text-gray-400">Created by Vijay Betigiri (vijay.betigiri@swisscom.com)</p>
          </div>
        </div>
      </footer>

      {/* Add some bottom padding to the main content to prevent overlap with fixed footer */}
      <div className="pb-20" />
    </>
  );
};

export default Footer; 