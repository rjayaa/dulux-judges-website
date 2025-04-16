"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { 
  ChevronLeft, 
  CheckSquare, 
  FileText, 
  Edit, 
  Trash, 
  AlertCircle, 
  Check, 
  Clock,
  ArrowRight,
  ExternalLink
} from "lucide-react";

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
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      }
    }
    
    checkAuth();
  }, [router]);
  
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Selections Finalized!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Thank you for completing your judging. Your selections have been submitted successfully.
          </p>
          
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => router.push("/submissions")}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-md transition-colors shadow-sm"
            >
              Back to Submissions
            </button>
            
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700"
            >
              Return to Home
            </button>
          </div>
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
                href="/submissions" 
                className="flex items-center gap-1 text-black bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors shadow-sm"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium">Back</span>
              </Link>
              
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Review Selections
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="hidden sm:inline-block px-3 py-1 text-sm font-medium rounded-md bg-primary/10 text-primary">
                {evaluationMethod === "checkbox" ? "Selection Mode" : "Scoring Mode"}
              </span>
              
              <span className="hidden sm:inline-block text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                {selectedSubmissions.length}/{MAX_EVALUATIONS}
              </span>
              
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
              <p className="text-center mt-4 text-gray-600">Loading your selections...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Your Selected Submissions
                  </h2>
                  <p className="text-sm text-gray-600">
                    Review and finalize your selections before submitting
                  </p>
                </div>
                
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={selectedSubmissions.length === 0}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    selectedSubmissions.length === 0
                      ? "bg-gray-200 cursor-not-allowed text-gray-400"
                      : "bg-primary hover:bg-primary/90 text-white"
                  }`}
                >
                  Finalize Selections
                </button>
              </div>
              
              {errorMessage && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-600 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </div>
              )}
              
              {successMessage && (
                <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-600 flex items-start">
                  <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p>{successMessage}</p>
                </div>
              )}
              
              {selectedSubmissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submission
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        {evaluationMethod === "scoring" && (
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Average Score
                          </th>
                        )}
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedSubmissions.map((submission) => (
                        <tr key={submission.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 mr-3">
                                <FileText className="h-5 w-5 text-gray-400" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {submission.title.length > 40
                                    ? submission.title.substring(0, 40) + "..."
                                    : submission.title}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(submission.submittedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {submission.categoryName}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {submission.submissionId}
                          </td>
                          {evaluationMethod === "scoring" && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary">
                                {renderScoreAverage(submission.scores)}
                              </span>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditSubmission(submission.id)}
                              className="p-1 text-gray-600 hover:text-primary mr-2"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveSubmission(submission.id)}
                              className="p-1 text-gray-600 hover:text-red-500"
                              title="Remove"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="p-4 bg-primary/10 inline-block rounded-full mb-4">
                    <FileText className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-lg text-gray-600 mb-4">
                    You haven't selected any submissions yet
                  </p>
                  <button
                    onClick={() => router.push("/submissions")}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-md transition-colors inline-flex items-center gap-2"
                  >
                    <span>Browse Submissions</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-200">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Finalize Your Selections</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to finalize your selections? This action cannot be undone.
            </p>
            {selectedSubmissions.length < MAX_EVALUATIONS && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">
                    You have selected {selectedSubmissions.length} of {MAX_EVALUATIONS} possible submissions.
                  </p>
                  <p className="text-sm">
                    Are you sure you don't want to use all your available selections?
                  </p>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalizeSelections}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-md transition-colors ${
                  isSubmitting 
                    ? "bg-gray-300 cursor-not-allowed text-gray-500"
                    : "bg-primary hover:bg-primary/90 text-white"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  "Confirm & Finalize"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}