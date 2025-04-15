'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PinLogin from '@/components/PinLogin';
import Image from 'next/image';
import { ChevronLeft, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [networkError, setNetworkError] = useState(false);
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth');
        const data = await response.json();
        
        if (data.success && data.authenticated) {
          // Already authenticated, redirect to evaluation method selection page
          router.push('/evaluation-method');
        } else {
          // Not authenticated, show login form
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setLoading(false);
        setNetworkError(true);
      }
    }
    
    checkAuth();
  }, [router]);

  // Handle login success
  const handleLoginSuccess = (success: boolean, errorMessage?: string) => {
    if (success) {
      router.push('/evaluation-method');
    } else if (errorMessage) {
      setError(errorMessage);
    }
  };

  // Handle retry on network error
  const handleRetry = () => {
    setNetworkError(false);
    setLoading(true);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background for mobile */}
      <div className="absolute inset-0 bg-[url('/images/bg-hero-home.webp')] bg-cover bg-center md:hidden"></div>
      <div className="absolute inset-0 bg-black bg-opacity-40 md:hidden"></div>
      
     

      <div className="w-full min-h-screen flex flex-col md:flex-row justify-center items-center relative">
        {/* Left side - login form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-4 sm:p-8 bg-white bg-opacity-95 md:bg-opacity-100 rounded-xl z-10 md:z-0 mx-4 md:mx-0 my-8 md:my-0 max-w-md md:max-w-none">
          <div className="text-center space-y-3 mb-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black">Judge Login</h1>
            <p className="text-gray-700">Enter your PIN to access the judging system</p>
          </div>

          {loading ? (
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-sm">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
              <p className="text-center mt-4 text-gray-600">Checking authentication...</p>
            </div>
          ) : networkError ? (
            <div className="bg-red-50 p-6 sm:p-8 rounded-lg shadow-md w-full max-w-sm border border-red-200">
              <div className="flex justify-center text-red-500">
                <AlertCircle className="h-12 w-12" />
              </div>
              <p className="text-center mt-4 text-gray-700 font-medium">Network Error</p>
              <p className="text-center text-gray-600 mb-4">Unable to connect to the server. Please check your internet connection.</p>
              <button 
                onClick={handleRetry}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <div className="w-full max-w-sm">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              <PinLogin onLogin={handleLoginSuccess} />
              
              {/* Add forgotten PIN option */}
              <div className="mt-6 text-center">
                <button 
                  className="text-primary hover:text-primary/80 text-sm font-medium hover:underline"
                  onClick={() => setError('Please contact an administrator to reset your PIN.')}
                >
                  Forgotten your PIN?
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Right side - image/illustration (desktop only) */}
        <div className="hidden md:block w-1/2 h-screen">
          <div className="h-full w-full relative bg-blueDulux">
            <Image
              src="/readme-assets/background/bg-hero-home.webp"
              alt="Judging background"
              fill
              quality={90}
              priority
              sizes="50vw"
              style={{ objectFit: 'cover' }}
              className="opacity-80"
            />
            <div className="absolute inset-0 bg-blueDulux bg-opacity-40"></div>
            <div className="relative h-full flex flex-col items-center justify-between p-8 lg:p-12">
              <div className="mt-40 sm:mt-52 md:mt-72 text-center mb-8">
                <Image
                  src="/favicon.ico"
                  alt="Dulux Logo"
                  width={200}
                  height={80}
                  className="w-full max-w-md"
                  priority
                />
              </div>

              <div className="mt-auto mb-8 w-full max-w-md">
                <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg border border-white border-opacity-20 text-white">
                  <h3 className="text-2xl font-bold mb-3">Judging System</h3>
                  <p className="mb-4">
                    Evaluate design submissions with our intuitive platform, designed for efficiency and accuracy.
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                      ?
                    </div>
                    <p className="text-sm">
                      Need help? Contact the administrator for assistance with your judging account.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}