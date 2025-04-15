"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import LogoutButton from "@/components/LogoutButton";

// Types for our submission data
type SubmissionFile = string;

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
  submissionFiles?: SubmissionFile[];
  evaluated?: boolean;
  scores?: {
    score1: string;
    score2: string;
    score3: string;
    score4: string;
  };
  comment?: string;
}

// Mock categories
const mockCategories = [
  { id: "cm7woadi6000tyzjp90iwliel", name: "Interior Design" },
  { id: "cm6v78vcu000ai0hyozdkfukr", name: "Architecture" },
  { id: "cm7woc3qw000uyzjpvbv4gy2x", name: "Product Design" },
];

export default function SubmissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const evaluationMethod = searchParams.get("method") || "checkbox";
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [evaluationCount, setEvaluationCount] = useState(0);
  const [comment, setComment] = useState("");
  const [isSelected, setIsSelected] = useState(false);
  const [scores, setScores] = useState({
    score1: "",
    score2: "",
    score3: "",
    score4: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const MAX_EVALUATIONS = 10;
  
  // Fetch submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, this would be an API call
        const response = await fetch(`/api/submissions?categoryId=${filterCategory}`);
        const data = await response.json();
        
        if (data.success) {
          setSubmissions(data.submissions);
          
          // Count already evaluated submissions
          const evaluatedCount = data.submissions.filter((sub: Submission) => sub.evaluated).length;
          setEvaluationCount(evaluatedCount);
        }
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubmissions();
  }, [filterCategory]);
  
  const filteredSubmissions = filterCategory === "all" 
    ? submissions 
    : submissions.filter(sub => sub.categoryId === filterCategory);
  
  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setCurrentFileIndex(0);
    
    // Set form fields based on existing evaluations
    if (submission.evaluated) {
      setComment(submission.comment || "");
      setIsSelected(true);
      if (evaluationMethod === "scoring" && submission.scores) {
        setScores(submission.scores);
      }
    } else {
      setComment("");
      setIsSelected(false);
      setScores({
        score1: "",
        score2: "",
        score3: "",
        score4: ""
      });
    }
    
    setErrorMessage(null);
    setSuccessMessage(null);
  };
  
  const handleNextFile = () => {
    if (!selectedSubmission || !selectedSubmission.submissionFiles) return;
    
    if (currentFileIndex < selectedSubmission.submissionFiles.length - 1) {
      setCurrentFileIndex(prev => prev + 1);
    }
  };
  
  const handlePrevFile = () => {
    if (currentFileIndex > 0) {
      setCurrentFileIndex(prev => prev - 1);
    }
  };
  
  const getCurrentFileUrl = () => {
    if (!selectedSubmission) return "";
    
    if (currentFileIndex === 0 && selectedSubmission.submissionFile) {
      return selectedSubmission.submissionFile;
    }
    
    if (selectedSubmission.submissionFiles && selectedSubmission.submissionFiles.length > 0) {
      const adjustedIndex = selectedSubmission.submissionFile ? currentFileIndex - 1 : currentFileIndex;
      return selectedSubmission.submissionFiles[adjustedIndex] || "";
    }
    
    return "";
  };
  
  const getTotalFiles = () => {
    if (!selectedSubmission) return 0;
    
    let count = 0;
    if (selectedSubmission.submissionFile) count++;
    if (selectedSubmission.submissionFiles) count += selectedSubmission.submissionFiles.length;
    
    return count;
  };
  
  const handleSubmitEvaluation = async () => {
    if (!selectedSubmission) return;
    
    // If we're removing an evaluation that was previously counted
    if (selectedSubmission.evaluated && !isSelected && evaluationMethod === "checkbox") {
      try {
        setIsSubmitting(true);
        setErrorMessage(null);
        
        // Prepare evaluation data for removal
        const evaluationData = {
          action: "evaluate",
          submissionId: selectedSubmission.id,
          method: evaluationMethod,
          comments: comment,
          selected: false,
          remove: true
        };
        
        // Call API to save evaluation
        const response = await fetch("/api/submissions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(evaluationData),
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Update evaluation count
          setEvaluationCount(prev => prev - 1);
          
          // Update submission state
          setSubmissions(prevSubmissions => {
            return prevSubmissions.map(sub => {
              if (sub.id === selectedSubmission.id) {
                return { ...sub, evaluated: false };
              }
              return sub;
            });
          });
          
          // Update selected submission
          setSelectedSubmission({
            ...selectedSubmission,
            evaluated: false
          });
          
          setSuccessMessage("Evaluation removed successfully!");
        } else {
          setErrorMessage(data.message || "Failed to remove evaluation.");
        }
      } catch (error) {
        console.error("Error removing evaluation:", error);
        setErrorMessage("An error occurred. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
      
      return;
    }
    
    // Check if adding a new evaluation would exceed the limit
    if (!selectedSubmission.evaluated && isSelected && evaluationCount >= MAX_EVALUATIONS) {
      setErrorMessage(`You have reached the maximum limit of ${MAX_EVALUATIONS} evaluations. Please remove some selections before adding new ones.`);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      
      // Prepare evaluation data based on method
      const evaluationData = {
        action: "evaluate",
        submissionId: selectedSubmission.id,
        method: evaluationMethod,
        comments: comment,
        selected: isSelected,
        ...(evaluationMethod === "scoring" && { scores })
      };
      
      // Call API to save evaluation
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(evaluationData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update evaluation count if this is a new evaluation
        if (!selectedSubmission.evaluated && isSelected) {
          setEvaluationCount(prev => prev + 1);
        }
        
        // Update submission state
        setSubmissions(prevSubmissions => {
          return prevSubmissions.map(sub => {
            if (sub.id === selectedSubmission.id) {
              return { 
                ...sub, 
                evaluated: isSelected,
                comment: comment,
                ...(evaluationMethod === "scoring" && { scores })
              };
            }
            return sub;
          });
        });
        
        // Update selected submission
        setSelectedSubmission({
          ...selectedSubmission,
          evaluated: isSelected,
          comment: comment,
          ...(evaluationMethod === "scoring" && { scores })
        });
        
        setSuccessMessage("Evaluation saved successfully!");
      } else {
        setErrorMessage(data.message || "Failed to submit evaluation.");
      }
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const goToReviewPage = () => {
    router.push("/review-selections");
  };
  
  // Render different evaluation forms based on the selected method
  const renderEvaluationForm = () => {
    if (!selectedSubmission) return null;
    
    if (evaluationMethod === "checkbox") {
      return (
        <div className="mt-4 border-t pt-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Select This Submission?</h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {evaluationCount} of {MAX_EVALUATIONS} selections used
              </span>
            </div>
            
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="selectSubmission" 
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                  checked={isSelected}
                  onChange={() => setIsSelected(!isSelected)}
                />
                <label htmlFor="selectSubmission" className="ml-2 text-gray-800 dark:text-gray-200 font-medium">
                  I select this submission
                </label>
                {selectedSubmission?.evaluated && (
                  <span className="ml-3 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Already Selected
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Comments (optional)
              </label>
              <textarea
                id="comments"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                placeholder="Add any comments about this submission..."
              ></textarea>
            </div>
            
            {errorMessage && (
              <div className="text-red-500 text-sm">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="text-green-500 text-sm">
                {successMessage}
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={handleSubmitEvaluation}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-md transition duration-200 ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed text-gray-700"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isSubmitting ? "Saving..." : "Save Selection"}
              </button>
            </div>
          </div>
        </div>
      );
    } else if (evaluationMethod === "scoring") {
      return (
        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Score This Submission</h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {evaluationCount} of {MAX_EVALUATIONS} evaluations used
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="score1" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Theme Relevance (1-10)
              </label>
              <input
                type="number"
                id="score1"
                min="1"
                max="10"
                value={scores.score1}
                onChange={(e) => setScores({...scores, score1: e.target.value})}
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
              />
            </div>
            <div>
              <label htmlFor="score2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Technical Execution (1-10)
              </label>
              <input
                type="number"
                id="score2"
                min="1"
                max="10"
                value={scores.score2}
                onChange={(e) => setScores({...scores, score2: e.target.value})}
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
              />
            </div>
            <div>
              <label htmlFor="score3" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Originality (1-10)
              </label>
              <input
                type="number"
                id="score3"
                min="1"
                max="10"
                value={scores.score3}
                onChange={(e) => setScores({...scores, score3: e.target.value})}
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
              />
            </div>
            <div>
              <label htmlFor="score4" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Overall Impact (1-10)
              </label>
              <input
                type="number"
                id="score4"
                min="1"
                max="10"
                value={scores.score4}
                onChange={(e) => setScores({...scores, score4: e.target.value})}
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Comments (optional)
            </label>
            <textarea
              id="comments"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
              placeholder="Add any comments about this submission..."
            ></textarea>
          </div>
          
          {errorMessage && (
            <div className="text-red-500 text-sm mt-2">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="text-green-500 text-sm mt-2">
              {successMessage}
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmitEvaluation}
              disabled={isSubmitting || !scores.score1 || !scores.score2 || !scores.score3 || !scores.score4}
              className={`px-4 py-2 rounded-md transition duration-200 ${
                isSubmitting || !scores.score1 || !scores.score2 || !scores.score3 || !scores.score4
                  ? "bg-gray-400 cursor-not-allowed text-gray-700"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isSubmitting ? "Saving..." : "Save Scores"}
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Judging Panel - {evaluationMethod === "checkbox" ? "Selection" : "Scoring"} Mode
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                You have selected {evaluationCount} of {MAX_EVALUATIONS} maximum submissions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Category
                </label>
                <select
                  id="category-filter"
                  className="block w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {mockCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={goToReviewPage}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Review Selections {evaluationCount > 0 && `(${evaluationCount})`}
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
            <div className="text-lg text-gray-600 dark:text-gray-400">Loading submissions...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Submissions List - 3 columns on desktop */}
            <div className="md:col-span-3 overflow-y-auto max-h-screen pr-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Submissions ({filteredSubmissions.length})</h2>
                <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                  {evaluationCount}/{MAX_EVALUATIONS}
                </span>
              </div>
              
              <div className="space-y-3">
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map(submission => (
                    <div 
                      key={submission.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedSubmission?.id === submission.id 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                          : submission.evaluated
                          ? "border-green-300 bg-green-50 dark:bg-green-900/10"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                      onClick={() => handleSelectSubmission(submission)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {submission.title.length > 25
                            ? submission.title.substring(0, 25) + "..." 
                            : submission.title}
                        </h3>
                        {submission.evaluated && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        ID: {submission.submissionId}
                      </div>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Category: {submission.categoryName}
                      </div>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-4 text-gray-500">
                    No submissions found for the selected filter.
                  </div>
                )}
              </div>
            </div>
            
            {/* Submission Viewer - 9 columns on desktop for wider display */}
            <div className="md:col-span-9">
              {selectedSubmission ? (
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
                  {/* Submission Title and Details */}
                  <div className="mb-6 border-b pb-4">
                    <div className="flex items-center mb-3">
                      <span className="px-3 py-1 text-sm font-bold rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-3">
                        ID: {selectedSubmission.submissionId}
                      </span>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedSubmission.title}
                      </h2>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {selectedSubmission.categoryName}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        {selectedSubmission.submissionType}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        Submitted: {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg border-l-4 border-blue-500">
                      <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
                        Description
                      </h3>
                      <div className="text-md text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto p-2">
                        {selectedSubmission.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Submission Files ({getTotalFiles()})
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handlePrevFile}
                          disabled={currentFileIndex === 0}
                          className={`p-1 rounded-full ${
                            currentFileIndex === 0
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {currentFileIndex + 1} / {getTotalFiles()}
                        </span>
                        <button
                          onClick={handleNextFile}
                          disabled={currentFileIndex === getTotalFiles() - 1}
                          className={`p-1 rounded-full ${
                            currentFileIndex === getTotalFiles() - 1
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* File thumbnails/list */}
                    {getTotalFiles() > 1 && (
                      <div className="mb-3 flex overflow-x-auto pb-2 space-x-2">
                        {selectedSubmission?.submissionFile && (
                          <div 
                            onClick={() => setCurrentFileIndex(0)}
                            className={`flex-shrink-0 cursor-pointer p-2 rounded border ${
                              currentFileIndex === 0 
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs">Main File</span>
                            </div>
                          </div>
                        )}
                        
                        {selectedSubmission?.submissionFiles?.map((_, idx) => {
                          const adjustedIdx = selectedSubmission.submissionFile ? idx + 1 : idx;
                          return (
                            <div 
                              key={idx}
                              onClick={() => setCurrentFileIndex(adjustedIdx)}
                              className={`flex-shrink-0 cursor-pointer p-2 rounded border ${
                                currentFileIndex === adjustedIdx 
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                                  : "border-gray-200 dark:border-gray-700"
                              }`}
                            >
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs">File {idx + 1}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Wider PDF viewer */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg h-[600px] flex items-center justify-center relative overflow-hidden">
                      <iframe
                        src={getCurrentFileUrl()}
                        className="w-full h-full"
                        title={`Submission file ${currentFileIndex + 1}`}
                      ></iframe>
                      
                      <a 
                        href={getCurrentFileUrl()} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute bottom-4 right-4 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-200"
                      >
                        Open Full Screen
                      </a>
                    </div>
                  </div>
                  
                  {/* Evaluation Form */}
                  {renderEvaluationForm()}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow flex items-center justify-center h-[800px]">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    <p className="text-lg">Select a submission to view</p>
                    <p className="mt-2 text-sm max-w-md mx-auto">
                      You can evaluate up to {MAX_EVALUATIONS} submissions. 
                      Use the "Review Selections" button to see all your selected submissions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}