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
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden">
      {/* Left side - login form */}
      <div className="w-full md:w-1/2 h-full flex items-center justify-center p-6 bg-white relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-black">Judge Login</h1>
            <p className="text-gray-600 mt-2">Enter your PIN to access the judging system</p>
          </div>

          {loading ? (
            <div className="bg-white p-6 rounded-lg shadow-md w-full">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
              <p className="text-center mt-4 text-gray-600">Checking authentication...</p>
            </div>
          ) : networkError ? (
            <div className="bg-red-50 p-6 rounded-lg shadow-md w-full border border-red-200">
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
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              <PinLogin onLogin={handleLoginSuccess} />
              
              {/* Add forgotten PIN option */}
              {/* <div className="mt-6 text-center">
                <button 
                  className="text-primary hover:text-primary/80 text-sm font-medium hover:underline"
                  onClick={() => setError('Please contact an administrator to reset your PIN.')}
                >
                  Forgotten your PIN?
                </button>
              </div> */}
            </>
          )}
        </div>
      </div>
      
      {/* Right side - image/illustration */}
      <div className="hidden md:block w-1/2 h-full relative bg-blueDulux">
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
        
        {/* Centered Judging System content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4/5 max-w-2xl">
            <div className="bg-white bg-opacity-15 backdrop-blur-md p-8 rounded-xl border border-white border-opacity-20 text-white">
              <h3 className="text-3xl font-bold mb-5 tracking-wide">Judging System</h3>
              <p className="text-lg mb-6 leading-relaxed">
                Evaluate design submissions with our intuitive platform, designed for efficiency and accuracy.
              </p>
              
              <div className="p-5 bg-white/10 rounded-lg border border-white/15">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    ?
                  </div>
                  <div>
                    <p className="font-medium mb-1">Need help?</p>
                    <p className="text-sm text-white/90">
                      Contact the administrator for assistance with your judging account.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile background (hidden on desktop) */}
      <div className="absolute inset-0 -z-10 md:hidden">
        <div className="absolute inset-0 bg-[url('/readme-assets/background/bg-hero-home.webp')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>
    </div>
  );
}