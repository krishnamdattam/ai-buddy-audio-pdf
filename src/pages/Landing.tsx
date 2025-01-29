import React from "react";
import { ContainerScroll, ContainerScrollRotate3D, ContainerScrollCard } from "@/components/ui/container-scroll-animation";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-indigo-500/10 rounded-full blur-3xl" />
      
      <main className="container mx-auto px-4 relative">
        {/* First Section - Original Tablet Effect */}
        <div className="pt-0">
          <ContainerScroll
            titleComponent={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-4xl font-semibold text-white">
                  Learn from the Experts with <br />
                  <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-600 transition-all duration-300">
                    AI Buddy
                  </span>
                </h1>
                <p className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto">
                  Turn your documents into captivating learning experiences.
                </p>
              </motion.div>
            }
          >
            <motion.div 
              className="relative h-full w-full group"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-sm rounded-2xl group-hover:from-purple-600/30 group-hover:to-indigo-600/30 transition-all duration-300" />
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-600/50 to-indigo-600/50 blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
              <img
                src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2940&auto=format&fit=crop"
                alt="AI Learning"
                className="w-full h-full object-cover object-center rounded-2xl relative z-10 transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </motion.div>
          </ContainerScroll>

          {/* Audio Learning Feature */}
          <motion.div 
            className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 backdrop-blur-sm mx-auto max-w-2xl -mt-20 relative z-20 hover:bg-gray-800/60 transition-all duration-300 group"
            whileHover={{ y: -5 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center group-hover:bg-purple-600/30 transition-colors duration-300">
                <svg className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors duration-300">Audio/ Video Learning</h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Enjoy engaging and interactive content to make learning fun and effective. Chat with experts for personalized help and advice.</p>
              </div>
            </div>

            {/* Scroll Down Indicator */}
            <motion.div 
              className="flex flex-col items-center mt-8"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-gray-400 mb-2">Scroll to explore</span>
              <svg 
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </motion.div>
          </motion.div>
        </div>

        {/* Second Section - Personalization */}
        <div className="mt-40">
          <ContainerScrollRotate3D
            titleComponent={
              <>
                <h2 className="text-4xl font-semibold text-white">
                  Personalised Learning Experience <br />
                  <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-600">
                    Your Style, Your Pace
                  </span>
                </h2>
              </>
            }
          >
            <div className="relative h-full w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl" />
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-600/50 to-pink-600/50 blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2940&auto=format&fit=crop"
                alt="Personalized Learning"
                className="w-full h-full object-cover object-center rounded-2xl relative z-10"
              />
            </div>
          </ContainerScrollRotate3D>

          {/* Personalization Feature */}
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 backdrop-blur-sm mx-auto max-w-2xl -mt-20 relative z-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Personalisation</h3>
                <p className="text-gray-400">Tailor your learning experience by choosing from a variety of personas, languages, teaching styles, and course templates. Create a unique journey that fits your needs and learning preferences.</p>
              </div>
            </div>

            {/* Scroll Down Indicator */}
            <div className="flex flex-col items-center mt-8 animate-bounce">
              <span className="text-gray-400 mb-2">Keep scrolling</span>
              <svg 
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Third Section - AI Integration */}
        <div className="mt-40">
          <ContainerScrollCard
            titleComponent={
              <>
                <h2 className="text-4xl font-semibold text-white">
                  Powered by Secure AI <br />
                  <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600">
                    Smart Learning Assistant
                  </span>
                </h2>
              </>
            }
          >
            <div className="relative h-full w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl" />
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-pink-600/50 to-purple-600/50 blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
              <img
                src="/images/aibuddyscreenshot.png"
                alt="AI Integration"
                className="w-full h-full object-cover object-center rounded-2xl relative z-10"
              />
            </div>
          </ContainerScrollCard>

          {/* AI Integration Feature */}
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 backdrop-blur-sm mx-auto max-w-2xl -mt-20 relative z-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-pink-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Secure AI Integration</h3>
                <p className="text-gray-400">Stay in full control of your information and enjoy a safe, private learning experience without depending on commercial AI platforms.</p>
              </div>
            </div>

            {/* Final Scroll Down Indicator */}
            <div className="flex flex-col items-center mt-8 animate-bounce">
              <span className="text-gray-400 mb-2">Almost there</span>
              <svg 
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Get Started Button */}
        <motion.div 
          className="flex justify-center w-full my-40 relative z-20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative">
            {/* Pulsating glow effect */}
            <div className="absolute -inset-6 bg-gradient-to-r from-purple-600/40 to-indigo-600/40 rounded-full opacity-40 group-hover:opacity-60 blur-2xl transition-all duration-700 animate-[pulse_3s_ease-in-out_infinite]" />
            
            {/* Rotating gradient border */}
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-purple-600/30 rounded-full opacity-50 group-hover:opacity-70 blur-xl animate-[spin_8s_linear_infinite]" />
            
            <Button
              onClick={() => navigate("/signin")}
              className="relative bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-12 py-6 rounded-full text-2xl font-semibold transition-all duration-500 group hover:shadow-[0_0_30px_-5px_rgba(147,51,234,0.3)] overflow-hidden"
            >
              <span className="relative z-10 group-hover:text-white transition-colors duration-500">
                Get Started
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Button>
          </div>
        </motion.div>
      </main>

      {/* Footer with hover effects */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm z-40">
        <motion.div 
          className="max-w-7xl mx-auto px-8 py-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400 hover:text-gray-300 transition-colors duration-200">© 2025 AI-Buddy. All rights reserved.</span>
              <span className="text-gray-600">•</span>
              <span className="text-sm text-gray-400 hover:text-gray-300 transition-colors duration-200">Version 2.0.0</span>
            </div>
            <p className="text-sm text-gray-400 hover:text-gray-300 transition-colors duration-200">Created by Vijay Betigiri (vijay.betigiri@swisscom.com)</p>
          </div>
        </motion.div>
      </footer>

      <div className="pb-20" />
    </div>
  );
};

export default Landing;