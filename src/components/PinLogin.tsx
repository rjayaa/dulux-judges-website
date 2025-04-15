'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface PinLoginProps {
  onLogin?: (success: boolean) => void;
}

const PinLogin: React.FC<PinLoginProps> = ({ onLogin }) => {
  const [pin, setPin] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const router = useRouter();

  // Handle input change
  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // If pasted content, distribute characters
      const chars = value.slice(0, 6).split('');
      const newPin = [...pin];
      chars.forEach((char, i) => {
        if (index + i < 6 && /^\d$/.test(char)) {
          newPin[index + i] = char;
        }
      });
      setPin(newPin);
      
      // Focus on appropriate input
      const nextIndex = Math.min(index + chars.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }
    
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle key press
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      // Move to previous input on left arrow
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      // Move to next input on right arrow
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle login
  const handleLogin = async () => {
    setError(null);
    
    // Check if PIN is complete
    if (pin.some(digit => digit === '')) {
      setError('Please enter all 6 digits of your PIN');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: "login",
          pin: pin.join('')
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        setError(data.message || 'Invalid PIN');
        setLoading(false);
        if (onLogin) onLogin(false);
        return;
      }
      
      // Success - call the onLogin callback
      if (onLogin) onLogin(true);
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
      setLoading(false);
      if (onLogin) onLogin(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-secondary p-3 rounded-full">
          <KeyRound className="text-primary h-7 w-7" />
        </div>
      </div>
      
      <h2 className="text-2xl text-primary font-bold text-center mb-2">Judge Access</h2>
      <p className="text-center text-black mb-8">
        Enter your 6-digit PIN to access the judging system
      </p>
      
      <div className="flex justify-center space-x-2 mb-8">
        {pin.map((digit, index) => (
          <div key={index} className="relative">
            <input
              ref={el => inputRefs.current[index] = el}
              type="text"
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              className="w-12 h-14 text-2xl text-center border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition-colors text-black font-bold"
              maxLength={6} // Allow pasting of full PIN
              inputMode="numeric"
              autoFocus={index === 0}
            />
            {index < 5 && (
              <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 text-primary">•</div>
            )}
          </div>
        ))}
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-6 text-center">
          {error}
        </div>
      )}
      
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-lg shadow hover:bg-third focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin mr-2 h-5 w-5" />
            Verifying...
          </>
        ) : 'Access Judging System'}
      </button>
      
      <div className="mt-8 border-t border-gray-200 pt-4 text-center text-sm text-gray-500">
        {/* <p>Demo PINs: 123456, 654321, 111111</p> */}
        <p className="mt-2">If you forgot your PIN, please contact the administrator</p>
      </div>
      
      <div className="mt-6 flex justify-center">
        <Image
          src="/favicon.ico"
          alt="Logo"
          width={50}
          height={50}
          className="h-10 w-auto"
        />
      </div>
    </div>
  );
};

export default PinLogin;