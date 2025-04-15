"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle input change for each PIN digit
  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    
    // Auto-focus to next input if value is entered
    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };
  
  // Handle key down for backspace to move to previous input
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate PIN (all digits filled)
    const pinValue = pin.join("");
    if (pinValue.length !== 6) {
      setError("Please enter all 6 digits of your PIN");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the auth API
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "login",
          pin: pinValue,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Redirect to evaluation method selection page
        router.push("/evaluation-method");
      } else {
        setError(data.message || "Authentication failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Judge Login</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Enter your 6-digit PIN to access the judging system
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center space-x-2">
            {pin.map((digit, index) => (
              <input
                key={index}
                id={`pin-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                required
                disabled={isLoading}
              />
            ))}
          </div>
          
          {error && (
            <div className="text-red-500 text-center text-sm mt-2">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 font-medium rounded-md transition duration-200 ${
              isLoading 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        
        {/* For demo purposes - display valid PINs */}
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Demo PINs: 123456, 654321, 111111
          </p>
        </div>
      </div>
    </div>
  );
}