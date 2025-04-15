"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LogoutButton from "@/components/LogoutButton";

// Types for our submission data
interface Submission {
  id: string;
  title: string;
  description: string;
  status: string;
  submittedAt: string;
  categoryId: string;
  categoryName?: string;
  submissionId: string;
  submissionType: string;
  submissionFile?: string;
  submissionFiles?: string[];
  evaluated?: boolean;
  scores?: {
    score1: string;
    score2: string;
    score3: string;
    score4: string;
  };
  comment?: string;
}

export default function ReviewSelectionsPage() {
  const router = useRouter();
  const [selectedSubmissions, setSelectedSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationMethod, setEvaluationMethod] = useState<"checkbox" | "scoring">("checkbox");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [finalizeComplete, setFinalizeComplete] = useState(false);
  
  const MAX_EVALUATIONS = 10;
  
  // Fetch evaluated submissions
  useEffect(() => {
    const fetchSelectedSubmissions = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, this would be an API call
        const response = await fetch("/api/submissions/selected");
        const data = await response.json();
        
        if (data.success) {
          setSelectedSubmissions(data.submissions);
          setEvaluationMethod(data.evaluationMethod || "checkbox");
        }
      } catch (error) {
        console.error("Error fetching selected submissions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSelectedSubmissions();
  }, []);
  
  const handleRemoveSubmission = async (submissionId: string) => {
    try {
      // Call API to remove selection
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "evaluate",
          submissionId,
          method: evaluationMethod,
          selected: false,
          remove: true
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setSelectedSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
        setSuccessMessage("Submission removed successfully");
        
        // Clear success message after a delay
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setErrorMessage(data.message || "Failed to remove submission");
      }
    } catch (error) {
      console.error("Error removing submission:", error);
      setErrorMessage("An error occurred. Please try again.");
    }
  };
  
  const handleEditSubmission = (submissionId: string) => {
    router.push(`/submissions?submissionId=${submissionId}`);
  };
  
  const handleFinalizeSelections = async () => {
    try {
      setIsSubmitting(true);
      
      // Call API to finalize selections
      const response = await fetch("/api/submissions/finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissions: selectedSubmissions.map(sub => sub.id)
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFinalizeComplete(true);
        setShowConfirmModal(false);
      } else {
        setErrorMessage(data.message || "Failed to finalize submissions");
        setShowConfirmModal(false);
      }
    } catch (error) {
      console.error("Error finalizing submissions:", error);
      setErrorMessage("An error occurred. Please try again.");
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderScoreAverage = (scores?: {
    score1: string;
    score2: string;
    score3: string;
    score4: string;
  }) => {
    if (!scores) return "N/A";
    
    const scoreValues = [
      parseInt(scores.score1) || 0,
      parseInt(scores.score2) || 0,
      parseInt(scores.score3) || 0,
      parseInt(scores.score4) || 0
    ];
    
    const sum = scoreValues.reduce((acc, score) => acc + score, 0);
    const average = sum / scoreValues.length;
    
    return average.toFixed(1);
  };
  
  // If finalization is complete, show completion screen
  if (finalizeComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Selections Finalized!
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Thank you for completing your judging. Your selections have been submitted successfully.
          </p>
          
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => router.push("/submissions")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200"
            >
              Back to Submissions
            </button>
            
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-200"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Review Your Selections
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                You have selected {selectedSubmissions.length} of {MAX_EVALUATIONS} maximum submissions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/submissions")}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-200"
              >
                Back to Submissions
              </button>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600 dark:text-gray-400">Loading your selections...</div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Your Selected Submissions
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review and finalize your selections before submitting
                </p>
              </div>
              
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={selectedSubmissions.length === 0}
                className={`px-4 py-2 rounded-md transition duration-200 ${
                  selectedSubmissions.length === 0
                    ? "bg-gray-400 cursor-not-allowed text-gray-200"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                Finalize Selections
              </button>
            </div>
            
            {errorMessage && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 dark:bg-red-900/30 dark:text-red-400">
                <p>{errorMessage}</p>
              </div>
            )}
            
            {successMessage && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 dark:bg-green-900/30 dark:text-green-400">
                <p>{successMessage}</p>
              </div>
            )}
            
            {selectedSubmissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Submission
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        ID
                      </th>
                      {evaluationMethod === "scoring" && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Average Score
                        </th>
                      )}
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                    {selectedSubmissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {submission.title.length > 40
                                  ? submission.title.substring(0, 40) + "..."
                                  : submission.title}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(submission.submittedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            {submission.categoryName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {submission.submissionId}
                        </td>
                        {evaluationMethod === "scoring" && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              {renderScoreAverage(submission.scores)}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditSubmission(submission.id)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveSubmission(submission.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                  You haven't selected any submissions yet
                </p>
                <button
                  onClick={() => router.push("/submissions")}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200"
                >
                  Browse Submissions
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-foreground">Finalize Your Selections</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to finalize your selections? This action cannot be undone.
            </p>
            {selectedSubmissions.length < MAX_EVALUATIONS && (
              <div className="mb-6 p-3 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-md">
                <p className="text-sm">
                  <strong>Note:</strong> You have selected {selectedSubmissions.length} of {MAX_EVALUATIONS} possible submissions.
                  Are you sure you don't want to use all your available selections?
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalizeSelections}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-md transition duration-200 ${
                  isSubmitting 
                    ? "bg-gray-400 cursor-not-allowed text-gray-200"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isSubmitting ? "Processing..." : "Confirm & Finalize"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}