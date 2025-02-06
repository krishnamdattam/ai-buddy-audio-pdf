import React, { useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session);
        navigate('/dashboard');
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Check if user is already authenticated
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('User already authenticated:', session);
        navigate('/dashboard');
      }
    };
    
    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden flex items-center justify-center">
      {/* Background gradient effects */}
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-indigo-500/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative"
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Welcome to AI Buddy
          </motion.h1>
          <motion.p 
            className="text-gray-400 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Sign in with your credentials
          </motion.p>
        </div>

        {/* Auth Container with Gradient Border */}
        <motion.div 
          className="relative group"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Gradient border effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-500" />
          
          {/* Main content container */}
          <div className="relative bg-gray-800/50 backdrop-blur-xl p-8 rounded-xl border border-gray-700 shadow-2xl">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                extend: true,
                className: {
                  container: "w-full",
                  button: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(147,51,234,0.3)]",
                  input: "bg-gray-700/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent",
                  label: "text-gray-300",
                  message: "text-purple-400",
                  anchor: "text-indigo-400 hover:text-indigo-300 transition-colors duration-200",
                  divider: "hidden",
                },
                variables: {
                  default: {
                    colors: {
                      brand: '#8B5CF6',
                      brandAccent: '#6D28D9',
                      brandButtonText: 'white',
                      defaultButtonBackground: '#4F46E5',
                      defaultButtonBackgroundHover: '#4338CA',
                      inputBackground: 'transparent',
                      inputBorder: '#4B5563',
                      inputBorderHover: '#6D28D9',
                      inputBorderFocus: '#8B5CF6',
                    },
                    space: {
                      buttonPadding: '12px 24px',
                      inputPadding: '12px',
                    },
                    borderWidths: {
                      buttonBorderWidth: '0px',
                      inputBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: '8px',
                      buttonBorderRadius: '8px',
                      inputBorderRadius: '8px',
                    },
                  },
                },
              }}
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Enterprise Email',
                    password_label: 'Password',
                    button_label: 'Sign in',
                    loading_button_label: 'Signing in...',
                  },
                },
              }}
              theme="dark"
              providers={[]}
              view="sign_in"
            />
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center mt-8 text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SignIn;