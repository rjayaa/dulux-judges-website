"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, CheckSquare, BarChart2, ArrowRight, AlertCircle, Info } from "lucide-react";

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
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm z-30 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="flex items-center gap-1 text-black bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors shadow-sm"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium">Back</span>
              </Link>
              
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Evaluation Method
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="hidden sm:inline-block text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                Step 1 of 3
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-gray-900">Choose Your Evaluation Method</h2>
                
                <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  </div>
                  <span>Step 1/3</span>
                </div>
              </div>
              
              <p className="text-gray-600">
                Select how you'd like to evaluate submissions. This choice will determine your judging interface throughout the competition.
              </p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                {/* Checkbox Option */}
                <div 
                  className={`relative p-6 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
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

                  <div className="mb-4">
                    <div className="inline-block p-3 rounded-lg bg-primary/10 text-primary mb-3">
                      <CheckSquare className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Checkbox Evaluation</h3>
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
                  className={`relative p-6 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
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

                  <div className="mb-4">
                    <div className="inline-block p-3 rounded-lg bg-primary/10 text-primary mb-3">
                      <BarChart2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Score Evaluation</h3>
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
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Info className="w-4 h-4" />
                  <span>You can review your selection on the next screen</span>
                </div>
                
                <button
                  onClick={handleContinue}
                  disabled={!selectedMethod || isLoading}
                  className={`group flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
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
            </div>
          </div>
          
          {/* Info card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">About Evaluation Methods</h3>
                <p className="text-sm text-gray-600">
                  Your choice will affect how you evaluate submissions throughout the competition. The checkbox method is simpler and faster, 
                  while the scoring method provides more detailed evaluation options.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal - Styled to match the app's aesthetics */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-200">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Confirm Your Selection</h3>
            <p className="text-gray-600 mb-6">
              You've selected <span className="font-semibold text-primary">
                {selectedMethod === "checkbox" ? "Checkbox" : "Score"} Evaluation
              </span>. 
              This choice will determine your judging interface and cannot be changed later.
            </p>
            
            <div className="p-4 mb-6 border border-gray-200 bg-gray-50 rounded-lg">
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
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-gray-700"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
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