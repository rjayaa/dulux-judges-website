"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, CheckSquare, BarChart2, ArrowRight, AlertCircle } from "lucide-react";

type EvaluationMethod = "checkbox" | "scoring" | null;

export default function EvaluationMethodPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<EvaluationMethod>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  
  // Check if user is authenticated
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        });
        
        if (!response.ok) {
          // Not authenticated, redirect to login
          router.push('/login');
        } else {
          setCheckingSession(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      }
    }
    
    checkAuth();
  }, [router]);
  
  const handleMethodSelect = (method: EvaluationMethod) => {
    setSelectedMethod(method);
    setError(null);
  };
  
  const handleContinue = () => {
    if (!selectedMethod) return;
    setShowConfirmation(true);
  };
  
  const handleConfirm = async () => {
    if (!selectedMethod) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the API to save the evaluation method
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "setEvaluationMethod",
          method: selectedMethod,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to set evaluation method");
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Navigate to the browse submissions page
        router.push(`/submissions?method=${selectedMethod}`);
      } else {
        setError(data.message || "Failed to set evaluation method");
        setShowConfirmation(false);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setShowConfirmation(false);
      console.error("Evaluation method error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white relative">
      {/* Stylized background that's different but complementary to login page */}
      <div className="absolute inset-0 md:hidden bg-[url('/images/bg-hero-home.webp')] bg-cover bg-center opacity-10"></div>
      <div className="absolute top-0 left-0 right-0 h-48 md:h-56 bg-gradient-to-b from-blueDulux/20 to-transparent"></div>
      
      {/* Header with back button and progress indicator */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 sm:p-6 z-10">
        <Link
          href="/login"
          className="flex items-center gap-1 text-black bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors shadow-sm"
          aria-label="Go back to login page"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="font-medium">BACK</span>
        </Link>
        
        <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
          </div>
          <span className="text-sm text-gray-600">Step 1 of 3</span>
        </div>
      </div>

      <div className="w-full min-h-screen pt-20 flex justify-center items-center">
        <div className="w-full max-w-5xl mx-auto p-4 sm:p-8 bg-white rounded-xl shadow-sm md:shadow-md my-4 md:my-10 z-10 relative">
          <div className="text-center mb-8 md:mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-3">
              Choose Your Evaluation Method
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Select how you'd like to evaluate submissions. This choice will determine your judging interface throughout the competition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-10">
            {/* Checkbox Option */}
            <div 
              className={`group relative p-6 md:p-8 rounded-2xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                selectedMethod === "checkbox"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-primary/30"
              }`}
              onClick={() => handleMethodSelect("checkbox")}
            >
              <div className="absolute top-4 right-4">
                <div className={`w-6 h-6 rounded-full border-2 transition-colors ${
                  selectedMethod === "checkbox" ? "border-primary bg-primary" : "border-gray-300"
                }`}>
                  {selectedMethod === "checkbox" && (
                    <CheckSquare className="w-4 h-4 text-white m-0.5" />
                  )}
                </div>
              </div>

              <div className="mb-6">
                <div className="inline-block p-3 rounded-lg bg-primary/10 text-primary mb-4">
                  <CheckSquare className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Checkbox Evaluation</h2>
                <p className="text-gray-600">
                  Perfect for objective criteria where submissions either meet requirements or don't.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Quick yes/no decisions</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Clear pass/fail criteria</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Simple evaluation process</span>
                </div>
              </div>
            </div>

            {/* Scoring Option */}
            <div 
              className={`group relative p-6 md:p-8 rounded-2xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                selectedMethod === "scoring"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-primary/30"
              }`}
              onClick={() => handleMethodSelect("scoring")}
            >
              <div className="absolute top-4 right-4">
                <div className={`w-6 h-6 rounded-full border-2 transition-colors ${
                  selectedMethod === "scoring" ? "border-primary bg-primary" : "border-gray-300"
                }`}>
                  {selectedMethod === "scoring" && (
                    <CheckSquare className="w-4 h-4 text-white m-0.5" />
                  )}
                </div>
              </div>

              <div className="mb-6">
                <div className="inline-block p-3 rounded-lg bg-primary/10 text-primary mb-4">
                  <BarChart2 className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Score Evaluation</h2>
                <p className="text-gray-600">
                  Ideal for nuanced evaluations requiring detailed scoring across multiple criteria.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Detailed scoring system</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Weighted criteria support</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Comprehensive analysis</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={handleContinue}
              disabled={!selectedMethod || isLoading}
              className={`group flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                !selectedMethod || isLoading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 text-white hover:shadow-lg"
              }`}
            >
              Continue
              <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                !selectedMethod || isLoading ? "text-gray-400" : "text-white"
              }`} />
            </button>
          </div>
          
          {/* Info message */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>You can continue reviewing your selection on the next screen.</p>
          </div>
        </div>
      </div>

      {/* Background image for desktop (reduced visibility compared to login) */}
      <div className="hidden md:block absolute bottom-0 right-0 w-full h-48 pointer-events-none">
        <div className="relative h-full w-full">
          <Image
            src="/readme-assets/background/bg-hero-home.webp"
            alt="Judging background"
            fill
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'bottom' }}
            className="opacity-20"
          />
        </div>
      </div>

      {/* Confirmation Modal - Styled to match the app's aesthetics */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl">
            <h3 className="text-2xl font-bold mb-4 text-black">Confirm Your Selection</h3>
            <p className="text-gray-600 mb-6 sm:mb-8">
              You've selected <span className="font-semibold text-primary">
                {selectedMethod === "checkbox" ? "Checkbox" : "Score"} Evaluation
              </span>. 
              This choice will determine your judging interface and cannot be changed later.
            </p>
            
            <div className="p-4 mb-6 border border-primary/20 bg-primary/5 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-md text-primary">
                  {selectedMethod === "checkbox" ? 
                    <CheckSquare className="w-5 h-5" /> : 
                    <BarChart2 className="w-5 h-5" />
                  }
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">
                    {selectedMethod === "checkbox" ? "Checkbox Evaluation" : "Score Evaluation"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedMethod === "checkbox" 
                      ? "You'll use yes/no selections for each criteria." 
                      : "You'll score submissions on a numeric scale."}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={isLoading}
                className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors order-1 sm:order-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}