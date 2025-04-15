"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type EvaluationMethod = "checkbox" | "scoring" | null;

export default function EvaluationMethodPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<EvaluationMethod>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl p-8 bg-white dark:bg-gray-900 rounded-lg shadow-md">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-foreground">Select Evaluation Method</h1>
          <p className="text-red-500 font-medium mt-2">
            IMPORTANT: This choice cannot be changed later
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Please select how you would like to evaluate the submissions
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Checkbox Evaluation Option */}
          <div 
            className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedMethod === "checkbox" 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
            onClick={() => handleMethodSelect("checkbox")}
          >
            <div className="flex items-center mb-4">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === "checkbox" ? "border-blue-500" : "border-gray-400"
              }`}>
                {selectedMethod === "checkbox" && (
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                )}
              </div>
              <h2 className="ml-3 text-lg font-semibold">Checkbox Evaluation</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Evaluate submissions using a set of predefined criteria checkboxes.
              Good for pass/fail or meets/doesn't meet criteria judgments.
            </p>
          </div>
          
          {/* Scoring Evaluation Option */}
          <div 
            className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedMethod === "scoring" 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
            onClick={() => handleMethodSelect("scoring")}
          >
            <div className="flex items-center mb-4">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === "scoring" ? "border-blue-500" : "border-gray-400"
              }`}>
                {selectedMethod === "scoring" && (
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                )}
              </div>
              <h2 className="ml-3 text-lg font-semibold">Score Evaluation</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Evaluate submissions by providing numerical scores for different criteria.
              Allows for nuanced judgment and weighted scoring.
            </p>
          </div>
        </div>
        
        {error && (
          <div className="text-red-500 text-center text-sm mb-4">
            {error}
          </div>
        )}
        
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedMethod || isLoading}
            className={`px-8 py-3 font-medium rounded-md transition duration-200 ${
              !selectedMethod || isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-foreground">Confirm Your Selection</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You've selected <span className="font-semibold">{selectedMethod === "checkbox" ? "Checkbox" : "Score"} Evaluation</span>. 
              This choice cannot be changed later in the judging process.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-200"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md transition duration-200 ${
                  isLoading 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}