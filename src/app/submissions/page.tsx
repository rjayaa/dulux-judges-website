"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search,
  Filter,
  AlertCircle,
  X,
  Check,
  Menu,
  MoreVertical,
  LogOut,
  FileText,
  Star,
  Download,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Info,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp
} from "lucide-react";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const ITEMS_PER_PAGE = 15;
  const MAX_EVALUATIONS = 10;
  
  // Fetch submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, this would be an API call
        const response = await fetch(`/api/submissions?categoryId=${filterCategory}`, {
          signal: AbortSignal.timeout(15000) // Timeout after 15 seconds
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Add category names to submissions
          const submissionsWithCategories = data.submissions.map((sub: Submission) => {
            const category = mockCategories.find(cat => cat.id === sub.categoryId);
            return {
              ...sub,
              categoryName: category ? category.name : 'Uncategorized'
            };
          });
          
          setSubmissions(submissionsWithCategories);
          
          // Count already evaluated submissions
          const evaluatedCount = submissionsWithCategories.filter((sub: Submission) => sub.evaluated).length;
          setEvaluationCount(evaluatedCount);
          
          // Reset pagination when filter changes
          setCurrentPage(1);
          
          // Select first submission if none is selected
          if (!selectedSubmission && submissionsWithCategories.length > 0) {
            setSelectedSubmission(submissionsWithCategories[0]);
          }
          
        } else {
          throw new Error(data.message || 'Failed to fetch submissions');
        }
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubmissions();
  }, [filterCategory, selectedSubmission]);
  
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
  
  // Filter submissions based on category and search query
  const filteredSubmissions = submissions
    .filter(sub => filterCategory === "all" || sub.categoryId === filterCategory)
    .filter(sub => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        sub.title.toLowerCase().includes(query) ||
        sub.description.toLowerCase().includes(query) ||
        sub.submissionId.toLowerCase().includes(query) ||
        (sub.categoryName && sub.categoryName.toLowerCase().includes(query))
      );
    });
  
  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE);
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(current => current + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(current => current - 1);
    }
  };
  
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
    
    if (currentFileIndex < getTotalFiles() - 1) {
      setCurrentFileIndex(prev => prev + 1);
    }
  };
  
  const handlePrevFile = () => {
    if (currentFileIndex > 0) {
      setCurrentFileIndex(prev => prev - 1);
    }
  };
  
  const handleNextSubmission = () => {
    const currentIndex = filteredSubmissions.findIndex(sub => sub.id === selectedSubmission?.id);
    if (currentIndex >= 0 && currentIndex < filteredSubmissions.length - 1) {
      handleSelectSubmission(filteredSubmissions[currentIndex + 1]);
    }
  };
  
  const handlePrevSubmission = () => {
    const currentIndex = filteredSubmissions.findIndex(sub => sub.id === selectedSubmission?.id);
    if (currentIndex > 0) {
      handleSelectSubmission(filteredSubmissions[currentIndex - 1]);
    }
  };
  
  const getCurrentFileUrl = () => {
    if (!selectedSubmission) return "";
    
    if (selectedSubmission.submissionFile && currentFileIndex === 0) {
      return selectedSubmission.submissionFile;
    }
    
    if (selectedSubmission.submissionFiles && selectedSubmission.submissionFiles.length > 0) {
      const adjustedIndex = selectedSubmission.submissionFile ? currentFileIndex - 1 : currentFileIndex;
      if (adjustedIndex >= 0 && adjustedIndex < selectedSubmission.submissionFiles.length) {
        return selectedSubmission.submissionFiles[adjustedIndex];
      }
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
    
    // Validate scores for scoring method
    if (evaluationMethod === "scoring" && isSelected) {
      if (!scores.score1 || !scores.score2 || !scores.score3 || !scores.score4) {
        setErrorMessage("Please fill in all score fields");
        return;
      }
      
      // Validate score ranges
      const allScores = [scores.score1, scores.score2, scores.score3, scores.score4];
      for (const score of allScores) {
        const numScore = parseInt(score);
        if (isNaN(numScore) || numScore < 1 || numScore > 10) {
          setErrorMessage("All scores must be between 1 and 10");
          return;
        }
      }
    }
    
    // If we're removing an evaluation that was previously counted
    if (selectedSubmission.evaluated && !isSelected && evaluationMethod === "checkbox") {
      try {
        setIsSubmitting(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        
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
        
        if (!response.ok) {
          throw new Error("Failed to communicate with server");
        }
        
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
          throw new Error(data.message || "Failed to remove evaluation.");
        }
      } catch (error) {
        console.error("Error removing evaluation:", error);
        setErrorMessage(error instanceof Error ? error.message : "An error occurred. Please try again.");
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
      setSuccessMessage(null);
      
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
      
      if (!response.ok) {
        throw new Error("Failed to communicate with server");
      }
      
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
        
        // Automatically go to next submission after saving if there is one
        setTimeout(() => {
          handleNextSubmission();
        }, 800);
        
      } else {
        throw new Error(data.message || "Failed to submit evaluation.");
      }
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      setErrorMessage(error instanceof Error ? error.message : "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const goToReviewPage = () => {
    router.push("/review-selections");
  };
  
  const handleRetry = () => {
    setIsLoading(true);
    window.location.reload();
  };
  
  // Render different evaluation forms based on the selected method
  const renderEvaluationForm = () => {
    if (!selectedSubmission) return null;
    
    if (evaluationMethod === "checkbox") {
      return (
        <div className="p-4 bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Select This Submission?</h3>
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                {evaluationCount} of {MAX_EVALUATIONS} selections used
              </span>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="selectSubmission"
                  className="w-5 h-5 text-primary focus:ring-primary"
                  checked={isSelected}
                  onChange={() => setIsSelected(!isSelected)}
                />
                <label htmlFor="selectSubmission" className="ml-2 text-gray-800 font-medium">
                  I select this submission
                </label>
                {selectedSubmission?.evaluated && (
                  <span className="ml-3 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Already Selected
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
                Comments (optional)
              </label>
              <textarea
                id="comments"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-800"
                placeholder="Add any comments about this submission..."
              ></textarea>
            </div>
            
            {errorMessage && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}
            {successMessage && (
              <div className="text-green-600 text-sm bg-green-50 border border-green-200 p-3 rounded-lg flex items-start">
                <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p>{successMessage}</p>
              </div>
            )}
            
            <div className="flex justify-between gap-2">
              <div className="flex gap-2">
                <button
                  onClick={handlePrevSubmission}
                  disabled={filteredSubmissions.findIndex(sub => sub.id === selectedSubmission?.id) <= 0}
                  className={`p-2 rounded-md transition ${filteredSubmissions.findIndex(sub => sub.id === selectedSubmission?.id) <= 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  title="Previous submission"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextSubmission}
                  disabled={filteredSubmissions.findIndex(sub => sub.id === selectedSubmission?.id) >= filteredSubmissions.length - 1}
                  className={`p-2 rounded-md transition ${filteredSubmissions.findIndex(sub => sub.id === selectedSubmission?.id) >= filteredSubmissions.length - 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  title="Next submission"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={handleSubmitEvaluation}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-md transition duration-200 ${isSubmitting
                  ? "bg-gray-300 cursor-not-allowed text-gray-600"
                  : "bg-primary hover:bg-primary/90 text-white"
                  }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </span>
                ) : "Save Selection"}
              </button>
            </div>
          </div>
        </div>
      );
    } else if (evaluationMethod === "scoring") {
      return (
        <div className="p-4 bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Score This Submission</h3>
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              {evaluationCount} of {MAX_EVALUATIONS} evaluations used
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
            <div>
              <label htmlFor="score1" className="block text-sm font-medium text-gray-700 mb-1">
                Theme Relevance (1-10)
              </label>
              <input
                type="number"
                id="score1"
                min="1"
                max="10"
                value={scores.score1}
                onChange={(e) => setScores({ ...scores, score1: e.target.value })}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-800"
              />
            </div>
            <div>
              <label htmlFor="score2" className="block text-sm font-medium text-gray-700 mb-1">
                Technical Execution (1-10)
              </label>
              <input
                type="number"
                id="score2"
                min="1"
                max="10"
                value={scores.score2}
                onChange={(e) => setScores({ ...scores, score2: e.target.value })}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-800"
              />
            </div>
            <div>
              <label htmlFor="score3" className="block text-sm font-medium text-gray-700 mb-1">
                Originality (1-10)
              </label>
              <input
                type="number"
                id="score3"
                min="1"
                max="10"
                value={scores.score3}
                onChange={(e) => setScores({ ...scores, score3: e.target.value })}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-800"
              />
            </div>
            <div>
              <label htmlFor="score4" className="block text-sm font-medium text-gray-700 mb-1">
                Overall Impact (1-10)
              </label>
              <input
                type="number"
                id="score4"
                min="1"
                max="10"
                value={scores.score4}
                onChange={(e) => setScores({ ...scores, score4: e.target.value })}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-800"
              />
            </div>
          </div>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="selectSubmission"
              className="w-5 h-5 text-primary focus:ring-primary"
              checked={isSelected}
              onChange={() => setIsSelected(!isSelected)}
            />
            <label htmlFor="selectSubmission" className="ml-2 text-gray-800 font-medium">
              Include this submission in your evaluation
            </label>
            {selectedSubmission?.evaluated && (
              <span className="ml-3 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                Already Evaluated
              </span>
            )}
          </div>
          
          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
              Comments (optional)
            </label>
            <textarea
              id="comments"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-800"
              placeholder="Add any comments about this submission..."
            ></textarea>
          </div>
          
          {errorMessage && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-lg flex items-start mt-4">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}
          {successMessage && (
            <div className="text-green-600 text-sm bg-green-50 border border-green-200 p-3 rounded-lg flex items-start mt-4">
              <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{successMessage}</p>
            </div>
          )}
          
          <div className="mt-4 flex justify-between gap-2">
            <div className="flex gap-2">
              <button
                onClick={handlePrevSubmission}
                disabled={filteredSubmissions.findIndex(sub => sub.id === selectedSubmission?.id) <= 0}
                className={`p-2 rounded-md transition ${filteredSubmissions.findIndex(sub => sub.id === selectedSubmission?.id) <= 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                title="Previous submission"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextSubmission}
                disabled={filteredSubmissions.findIndex(sub => sub.id === selectedSubmission?.id) >= filteredSubmissions.length - 1}
                className={`p-2 rounded-md transition ${filteredSubmissions.findIndex(sub => sub.id === selectedSubmission?.id) >= filteredSubmissions.length - 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                title="Next submission"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            
            <button
              onClick={handleSubmitEvaluation}
              disabled={isSubmitting || (!isSelected && !selectedSubmission.evaluated) || !scores.score1 || !scores.score2 || !scores.score3 || !scores.score4}
              className={`px-4 py-2 rounded-md transition duration-200 ${isSubmitting || (!isSelected && !selectedSubmission.evaluated) || !scores.score1 || !scores.score2 || !scores.score3 || !scores.score4
                ? "bg-gray-300 cursor-not-allowed text-gray-600"
                : "bg-primary hover:bg-primary/90 text-white"
                }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </span>
              ) : "Save Evaluation"}
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm z-30 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link
                href="/evaluation-method"
                className="flex items-center gap-1 text-black bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors shadow-sm"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium">Back</span>
              </Link>
            
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Submissions
              </h1>
            
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="ml-2 p-2 text-gray-600 hover:text-gray-900 lg:hidden"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          
            <div className="flex items-center space-x-3">
              <span className="hidden sm:inline-block px-3 py-1 text-sm font-medium rounded-md bg-primary/10 text-primary">
                {evaluationMethod === "checkbox" ? "Selection Mode" : "Scoring Mode"}
              </span>
            
              <span className="hidden sm:inline-block text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                {evaluationCount}/{MAX_EVALUATIONS}
              </span>
            
              <button
                onClick={goToReviewPage}
                className="hidden sm:flex items-center gap-1 px-3 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-md transition-colors shadow-sm"
              >
                <Check className="h-4 w-4" />
                <span>Review</span>
              </button>
            
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
    
      {/* Main Content - Google Drive-inspired layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Collapsible on mobile */}
        <div className={`bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-full sm:w-72 lg:w-80'
          }`}>
          <div className="p-4">
            {/* Search and filters */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search submissions..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-800"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          
            <div className="mb-4">
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category-filter"
                className="block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-800"
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
          
            {/* Submission list - Similar to Google Drive's file list */}
            <div className="text-sm font-medium text-gray-700 flex justify-between items-center mb-2">
              <span>{filteredSubmissions.length} submissions</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`p-1 rounded ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span>Page {currentPage}/{totalPages}</span>
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`p-1 rounded ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          
            <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : paginatedSubmissions.length > 0 ? (
                paginatedSubmissions.map(submission => (
                  <div
                    key={submission.id}
                    className={`p-2 rounded-md cursor-pointer transition-colors flex items-center ${selectedSubmission?.id === submission.id
                        ? "bg-primary/10 text-primary border-l-4 border-primary pl-2"
                        : submission.evaluated
                          ? "hover:bg-gray-100 border-l-4 border-green-500 pl-2"
                          : "hover:bg-gray-100"
                      }`}
                    onClick={() => handleSelectSubmission(submission)}
                  >
                    <div className="mr-3 flex-shrink-0">
                      <FileText className={`h-5 w-5 ${selectedSubmission?.id === submission.id
                          ? "text-primary"
                          : submission.evaluated
                            ? "text-green-500"
                            : "text-gray-500"
                        }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {submission.title}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span>{submission.categoryName}</span>
                        <span>•</span>
                        <span className="truncate">ID: {submission.submissionId.substring(0, 8)}</span>
                      </div>
                    </div>
                    {submission.evaluated && (
                      <span className="ml-2 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Filter className="mx-auto h-8 w-8 mb-2" />
                  <p>No submissions found</p>
                  {(searchQuery || filterCategory !== "all") && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setFilterCategory("all");
                      }}
                      className="mt-2 text-primary text-sm font-medium"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      
        {/* Main content area - Preview and evaluation */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          {selectedSubmission ? (
            <div className="max-w-4xl mx-auto">
              {/* File preview with navigation and detailed information */}
              <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Header with submission title and ID */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex flex-wrap justify-between items-start gap-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-900">{selectedSubmission.title}</h2>
                    <div className="px-3 py-1 bg-gray-100 rounded-md text-sm text-gray-700">
                      ID: <span className="font-medium">{selectedSubmission.submissionId.substring(0, 10)}...</span>
                    </div>
                  </div>
                
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {selectedSubmission.categoryName}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs">
                      {selectedSubmission.submissionType}
                    </span>
                  </div>
                
                  {/* Submission description - collapsible */}
           {/* Submission description - collapsible, dengan perbaikan */}
<div className="relative">
  <div className={`text-gray-700 text-sm ${
    showFullDescription ? 'max-h-none' : 'max-h-20 overflow-hidden'
  }`}>
    <p className="whitespace-pre-line">{selectedSubmission.description}</p>
  </div>
  
  {/* Gradient fade effect when collapsed - posisi sebelum tombol, z-index lebih rendah */}
  {!showFullDescription && (
    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent z-10"></div>
  )}
  
  {/* Tombol dengan z-index lebih tinggi sehingga dapat diklik */}
  <button 
    onClick={() => setShowFullDescription(!showFullDescription)}
    className="mt-1 text-primary hover:text-primary/80 text-xs font-medium flex items-center relative z-20"
  >
    {showFullDescription ? (
      <>
        <span>Show less</span>
        <ChevronUp className="h-3 w-3 ml-1" />
      </>
    ) : (
      <>
        <span>Show more</span>
        <ChevronDown className="h-3 w-3 ml-1" />
      </>
    )}
  </button>
</div>
                </div>

                {/* File preview navigation */}
                <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Preview
                    </span>
                    {getTotalFiles() > 1 && (
                      <span className="text-sm text-gray-600">
                        {currentFileIndex + 1} of {getTotalFiles()}
                      </span>
                    )}
                  </div>
                
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevFile}
                      disabled={currentFileIndex === 0}
                      className={`p-1.5 rounded ${currentFileIndex === 0
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-200"
                        }`}
                      aria-label="Previous file"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  
                    <button
                      onClick={handleNextFile}
                      disabled={currentFileIndex === getTotalFiles() - 1}
                      className={`p-1.5 rounded ${currentFileIndex === getTotalFiles() - 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-200"
                        }`}
                      aria-label="Next file"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  
                    <a
                      href={getCurrentFileUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-700 hover:bg-gray-200 rounded"
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  
                    <a
                      href={getCurrentFileUrl()}
                      download
                      className="p-1.5 text-gray-700 hover:bg-gray-200 rounded"
                      title="Download file"
                    >
                      <Download className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              
                {/* File thumbnails (horizontal scrolling) - IMPROVED */}
                {getTotalFiles() > 1 && (
                  <div className="flex overflow-x-auto py-4 px-4 bg-gray-50 border-b border-gray-200 gap-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {selectedSubmission?.submissionFile && (
                      <div
                        onClick={() => setCurrentFileIndex(0)}
                        className={`flex-shrink-0 transition-all duration-200 cursor-pointer group ${currentFileIndex === 0
                            ? "transform scale-100"
                            : "opacity-80 hover:opacity-100"
                          }`}
                      >
                        <div className={`relative w-36 h-24 rounded-lg overflow-hidden border-2 ${currentFileIndex === 0
                            ? "border-primary shadow-md ring-2 ring-primary/20"
                            : "border-gray-200 group-hover:border-gray-300"
                          }`}>
                          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                            <FileText className={`h-10 w-10 ${currentFileIndex === 0 ? "text-primary" : "text-gray-400 group-hover:text-gray-500"}`} />
                          </div>
                        
                          <div className="absolute bottom-0 left-0 right-0 bg-gray-800/70 backdrop-blur-sm py-1 px-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-white truncate">Main File</span>
                              {currentFileIndex === 0 && (
                                <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">Current</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  
                    {selectedSubmission?.submissionFiles?.map((fileUrl, idx) => {
                      const adjustedIdx = selectedSubmission.submissionFile ? idx + 1 : idx;
                      // Try to determine file type from URL for better icon/preview
                      const fileExt = fileUrl.split('.').pop()?.toLowerCase();
                      const isPdf = fileExt === 'pdf';
                      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(fileExt || '');
                    
                      return (
                        <div
                          key={idx}
                          onClick={() => setCurrentFileIndex(adjustedIdx)}
                          className={`flex-shrink-0 transition-all duration-200 cursor-pointer group ${currentFileIndex === adjustedIdx
                              ? "transform scale-100"
                              : "opacity-80 hover:opacity-100"
                            }`}
                        >
                          <div className={`relative w-36 h-24 rounded-lg overflow-hidden border-2 ${currentFileIndex === adjustedIdx
                              ? "border-primary shadow-md ring-2 ring-primary/20"
                              : "border-gray-200 group-hover:border-gray-300"
                            }`}>
                            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                              {isImage ? (
                                <>
                                  {/* Attempt to show thumbnail for images */}
                                  <img
                                    src={fileUrl}
                                    alt={`Thumbnail ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Fallback to icon if image fails to load
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="hidden items-center justify-center">
                                    <FileText className={`h-10 w-10 ${currentFileIndex === adjustedIdx ? "text-primary" : "text-gray-400"}`} />
                                  </div>
                                </>
                              ) : isPdf ? (
                                <div className={`${currentFileIndex === adjustedIdx ? "text-red-500" : "text-red-400"}`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M7 11.5h1v-1H7v1zm0 2h1v-1H7v1zm0 2h1v-1H7v1zm2-6h6v-1H9v1zm0 2h6v-1H9v1zm0 2h6v-1H9v1zm0 2h6v-1H9v1z" />
                                    <path d="M6 2v20h12V6.828L13.172 2H6zm0-2h8l6 6v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" />
                                  </svg>
                                </div>
                              ) : (
                                <FileText className={`h-10 w-10 ${currentFileIndex === adjustedIdx ? "text-primary" : "text-gray-400 group-hover:text-gray-500"}`} />
                              )}
                            </div>
                          
                            <div className="absolute bottom-0 left-0 right-0 bg-gray-800/70 backdrop-blur-sm py-1 px-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-white truncate">File {idx + 1}</span>
                                {currentFileIndex === adjustedIdx && (
                                  <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">Current</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              
                {/* Main file preview iframe */}
                <div className="h-[500px] flex items-center justify-center relative">
                  {getCurrentFileUrl() ? (
                    <iframe
                      src={getCurrentFileUrl()}
                      className="w-full h-full"
                      title={`Submission file ${currentFileIndex + 1}`}
                    ></iframe>
                  ) : (
                    <div className="text-center text-gray-500">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p>File not available</p>
                    </div>
                  )}
                </div>
              </div>
            
              {/* Evaluation form */}
              {renderEvaluationForm()}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 max-w-md p-6">
                <div className="mb-4 p-4 bg-primary/10 inline-block rounded-full">
                  <FileText className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Select a submission to view</h3>
                <p className="text-gray-600">
                  Choose a submission from the list to view its details and evaluate it.
                </p>
                {sidebarCollapsed && (
                  <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md inline-flex items-center gap-2"
                  >
                    <Menu className="h-4 w-4" />
                    <span>Show Submissions</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    
      {/* Mobile bottom navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex justify-between z-20">
        <Link
          href="/evaluation-method"
          className="flex flex-col items-center justify-center text-gray-600"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-xs">Back</span>
        </Link>
      
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex flex-col items-center justify-center text-gray-600"
        >
          <Menu className="h-6 w-6" />
          <span className="text-xs">List</span>
        </button>
      
        <button
          onClick={goToReviewPage}
          className="flex flex-col items-center justify-center text-primary"
        >
          <div className="relative">
            <Check className="h-6 w-6" />
            {evaluationCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-white text-xs flex items-center justify-center">
                {evaluationCount}
              </div>
            )}
          </div>
          <span className="text-xs">Review</span>
        </button>
      
        <LogoutButton className="flex flex-col items-center justify-center text-gray-600" />
      </div>
    </div>
  );
}