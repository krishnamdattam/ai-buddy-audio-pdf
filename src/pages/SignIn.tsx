import { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SignIn = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white text-center">
            Personalised Audio Learning Platform (PoC)
          </h1>
          <p className="text-xl text-gray-200 text-center mt-2">
            Sign in to access personalised audio courses
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto mt-8 px-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#6366f1',
                    brandAccent: '#4f46e5',
                    inputText: 'white',
                  },
                },
              },
              style: {
                input: {
                  color: 'white',
                  backgroundColor: 'rgba(55, 65, 81, 1)',
                },
              },
            }}
            providers={[]}
            view="sign_in"
          />
        </div>
      </div>
    </div>
  );
};

export default SignIn;