
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search,
  AlertCircle,
  X,
  Check,
  ArrowUpDown,
  FileText,
  Star,
  Download,
  ExternalLink,
  Info,
  Clock,
  ChevronDown,
  ChevronUp,
  Trophy,
  Filter,
  Users,
  ListFilter,
  Loader2,
  Eye,
  Medal
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
  isTopFive?: boolean;
}

interface JuryEvaluation {
  id: string;
  juryId: string;
  juryName: string;
  submissionId: string;
  submissionTitle: string;
  submissionDescription?: string;
  categoryName?: string;
  evaluationMethod: string;
  selected: boolean;
  score1?: number;
  score2?: number;
  score3?: number;
  score4?: number;
  comments?: string;
  submissionFile?: string;
  submissionFiles?: SubmissionFile[];
  isFinalized: boolean;
  createdAt: string;
}

export default function AdminTop5Page() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [topFiveSelections, setTopFiveSelections] = useState<Submission[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "title" | "category">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "top5" | "evaluations">("grid");
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [juryEvaluations, setJuryEvaluations] = useState<JuryEvaluation[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<JuryEvaluation | null>(null);
  
  const MAX_TOP_SELECTIONS = 6;
  
  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsAuthChecking(true);
        const response = await fetch('/api/auth', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const data = await response.json();
        
        // Check if the user is authenticated and is an admin
        if (data.success && data.authenticated && data.judge?.id === "00832") {
          setIsAuthenticated(true);
          fetchSubmissions(); // Only fetch data if authenticated
        } else {
          setIsAuthenticated(false);
          // Redirect to login
          router.push('/login?redirectTo=' + encodeURIComponent('/admin/top-five'));
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        router.push('/login');
      } finally {
        setIsAuthChecking(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  // Fetch submissions only if authenticated
  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Fetch all submissions
      const response = await fetch(`/api/admin/top-five?categoryId=${filterCategory}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(15000) // Timeout after 15 seconds
      });
      
      if (response.status === 401) {
        setErrorMessage("Unauthorized. Please log in again.");
        router.push('/login?redirectTo=/admin/top-five');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Process submissions and categories
        setSubmissions(data.submissions);
        setCategories(data.categories || []);
        
        // Set initial filtered submissions
        setFilteredSubmissions(data.submissions);
        
        // Set initial selected submission
        if (data.submissions.length > 0) {
          setSelectedSubmission(data.submissions[0]);
        }
        
        // Get already selected top 5
        const initialTopFive = data.submissions.filter(sub => sub.isTopFive);
        setTopFiveSelections(initialTopFive);
        
        // Get jury evaluations if available
        if (data.juryEvaluations) {
          setJuryEvaluations(data.juryEvaluations);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch submissions');
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setErrorMessage("Failed to load submissions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refetch when filter category changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
    }
  }, [filterCategory, isAuthenticated]);
  
  // Filter and sort submissions when search or sort changes
  useEffect(() => {
    const filtered = submissions
      .filter(sub => filterCategory === "all" || sub.categoryId === filterCategory)
      .filter(sub => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          sub.title.toLowerCase().includes(query) ||
          sub.description?.toLowerCase().includes(query) ||
          sub.submissionId.toLowerCase().includes(query) ||
          (sub.categoryName && sub.categoryName.toLowerCase().includes(query))
        );
      });
    
    // Sort submissions based on the selected sort method
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === "date") {
        comparison = new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      } else if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === "category") {
        comparison = (a.categoryName || "").localeCompare(b.categoryName || "");
      }
      
      // Reverse if sort direction is ascending
      return sortDirection === "asc" ? comparison * -1 : comparison;
    });
    
    setFilteredSubmissions(sorted);
  }, [submissions, searchQuery, sortBy, sortDirection, filterCategory]);
  
  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setCurrentFileIndex(0);
    setShowFullDescription(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSelectedEvaluation(null); // Clear any selected evaluation when selecting a submission
  };
  
  const handleSelectEvaluation = (evaluation: JuryEvaluation) => {
    setSelectedEvaluation(evaluation);
    setCurrentFileIndex(0);
    setShowFullDescription(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSelectedSubmission(null); // Clear any selected submission when selecting an evaluation
  };
  
  const getCurrentFileUrl = () => {
    if (selectedSubmission) {
      if (selectedSubmission.submissionFile && currentFileIndex === 0) {
        return selectedSubmission.submissionFile;
      }
      
      if (selectedSubmission.submissionFiles && selectedSubmission.submissionFiles.length > 0) {
        const adjustedIndex = selectedSubmission.submissionFile ? currentFileIndex - 1 : currentFileIndex;
        if (adjustedIndex >= 0 && adjustedIndex < selectedSubmission.submissionFiles.length) {
          return selectedSubmission.submissionFiles[adjustedIndex];
        }
      }
    } else if (selectedEvaluation) {
      if (selectedEvaluation.submissionFile && currentFileIndex === 0) {
        return selectedEvaluation.submissionFile;
      }
      
      if (selectedEvaluation.submissionFiles && selectedEvaluation.submissionFiles.length > 0) {
        const adjustedIndex = selectedEvaluation.submissionFile ? currentFileIndex - 1 : currentFileIndex;
        if (adjustedIndex >= 0 && adjustedIndex < selectedEvaluation.submissionFiles.length) {
          return selectedEvaluation.submissionFiles[adjustedIndex];
        }
      }
    }
    
    return "";
  };
  
  const getTotalFiles = () => {
    let count = 0;
    
    if (selectedSubmission) {
      if (selectedSubmission.submissionFile) count++;
      if (selectedSubmission.submissionFiles) count += selectedSubmission.submissionFiles.length;
    } else if (selectedEvaluation) {
      if (selectedEvaluation.submissionFile) count++;
      if (selectedEvaluation.submissionFiles) count += selectedEvaluation.submissionFiles.length;
    }
    
    return count;
  };
  
  const handleNextFile = () => {
    if ((!selectedSubmission && !selectedEvaluation) || currentFileIndex >= getTotalFiles() - 1) return;
    setCurrentFileIndex(prev => prev + 1);
  };
  
  const handlePrevFile = () => {
    if (currentFileIndex > 0) {
      setCurrentFileIndex(prev => prev - 1);
    }
  };
  
  const handleToggleTopFive = (submission: Submission) => {
    // Check if submission is already in top 5
    const isAlreadySelected = topFiveSelections.some(s => s.id === submission.id);
    
    if (isAlreadySelected) {
      // Remove from top 5
      setTopFiveSelections(prev => prev.filter(s => s.id !== submission.id));
      setSuccessMessage(`Removed "${submission.title}" from Top 5 selections`);
    } else {
      // Check if already at max selections
      if (topFiveSelections.length >= MAX_TOP_SELECTIONS) {
        setErrorMessage(`You can only select up to ${MAX_TOP_SELECTIONS} submissions. Please remove one before adding another.`);
        return;
      }
      
      // Add to top 5
      setTopFiveSelections(prev => [...prev, submission]);
      setSuccessMessage(`Added "${submission.title}" to Top 5 selections`);
    }
    
    // Clear message after a delay
    setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 3000);
  };
  
  const handleSaveTopFive = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      
      // Prepare the data for API
      const submissionsData = topFiveSelections.map((submission, index) => ({
        id: submission.id,
        rank: index + 1
      }));
      
      // Call API to save top 5 selections
      const response = await fetch("/api/admin/top-five", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          submissions: submissionsData
        }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized. Please log in again.");
        }
        throw new Error("Failed to communicate with server");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage("Top 5 selections saved successfully!");
        setShowConfirmModal(false);
        
        // Update the submissions to reflect the new top 5 status
        setSubmissions(prevSubmissions => {
          return prevSubmissions.map(sub => ({
            ...sub,
            isTopFive: topFiveSelections.some(ts => ts.id === sub.id)
          }));
        });
      } else {
        throw new Error(data.message || "Failed to save top 5 selections");
      }
    } catch (error) {
      console.error("Error saving top 5 selections:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to save selections. Please try again.");
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const clearFilters = () => {
    setSearchQuery("");
    setFilterCategory("all");
    setSortBy("date");
    setSortDirection("desc");
  };
  
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };
  
  const handleLogout = async () => {
    try {
      // Call the logout endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      
      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  // If checking auth, show loading state
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <h2 className="text-xl font-semibold mb-2">Checking authentication...</h2>
          <p className="text-gray-600">Please wait while we verify your credentials.</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, redirect has already been triggered,
  // but show a message while that happens
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Not Authorized</h2>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <Link href="/login" className="inline-block px-4 py-2 bg-primary text-white rounded-md">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }
  
  // Add this function to render the Top 5 view
  const renderTop5View = () => {
    if (topFiveSelections.length === 0) {
      return (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Top 5 Selections Yet</h3>
          <p className="text-gray-600 mb-4">
            You haven't selected any submissions for your Top 5 yet. Use the grid or list view to select submissions.
          </p>
          <button
            onClick={() => setViewMode("grid")}
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Go to Grid View
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {topFiveSelections.map((submission, index) => (
          <div 
            key={submission.id}
            className="bg-white rounded-lg shadow-sm border border-amber-200 overflow-hidden transition-all duration-200"
          >
            {/* Header with rank and title */}
            <div className="bg-amber-50 p-4 border-b border-amber-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-gray-900">{submission.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectSubmission(submission)}
                  className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-md"
                  title="View Details"
                >
                  <Eye className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleToggleTopFive(submission)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                  title="Remove from Top 5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Preview section */}
            <div className="p-4 flex flex-col md:flex-row gap-4">
              {/* Left side - file preview */}
              <div className="w-full md:w-1/3 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center h-80">
                {submission.submissionFile ? (
                  <iframe 
                    src={submission.submissionFile}
                    className="w-full h-full"
                    title={submission.title}
                  ></iframe>
                ) : (
                  <FileText className="h-12 w-12 text-gray-400" />
                )}
              </div>
              
              {/* Right side - details */}
              <div className="w-full md:w-2/3">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {submission.categoryName || "Uncategorized"}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs">
                    ID: {submission.submissionId}
                  </span>
                  {submission.submissionFiles && submission.submissionFiles.length > 0 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center">
                      <FileText className="w-3 h-3 mr-1" />
                      {submission.submissionFiles.length + (submission.submissionFile ? 1 : 0)} files
                    </span>
                  )}
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                  <p className="text-sm text-gray-600 line-clamp-6">
                    {submission.description || "No description provided."}
                  </p>
                </div>
                
                {/* Additional files thumbnails */}
                {submission.submissionFiles && submission.submissionFiles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Files</h4>
                    <div className="flex overflow-x-auto gap-2 pb-2">
                      {submission.submissionFiles.map((fileUrl, idx) => (
                        <a 
                          key={idx}
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 w-20 h-20 border border-gray-200 rounded-md bg-gray-50 flex items-center justify-center hover:border-primary transition-colors"
                        >
                          <FileText className="h-6 w-6 text-gray-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleSelectSubmission(submission)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary/90"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render jury evaluations view
  const renderEvaluationsView = () => {
    if (juryEvaluations.length === 0) {
      return (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <Medal className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jury Evaluations Yet</h3>
          <p className="text-gray-600 mb-4">
            No jury evaluations have been submitted yet.
          </p>
        </div>
      );
    }

    return (
      <div>
        {/* Evaluations table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-lg text-gray-900">Jury Evaluations (Selected Submissions)</h2>
            <p className="text-sm text-gray-600">Showing top evaluations from all jury members</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jury Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {juryEvaluations.slice(0, 10).map((evaluation) => (
                  <tr 
                    key={evaluation.id}
                    className={`hover:bg-gray-50 ${selectedEvaluation?.id === evaluation.id ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{evaluation.juryName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{evaluation.submissionTitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {evaluation.categoryName || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${evaluation.evaluationMethod === 'checkbox' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'}`
                      }>
                        {evaluation.evaluationMethod === 'checkbox' ? 'Checkbox' : 'Scoring'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${evaluation.isFinalized 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-amber-100 text-amber-800'}`
                      }>
                        {evaluation.isFinalized ? 'Finalized' : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleSelectEvaluation(evaluation)}
                        className="px-3 py-1 bg-primary text-white text-xs rounded-md hover:bg-primary/90"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Selected evaluation details */}
        {selectedEvaluation && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-lg text-gray-900">
                  Evaluation by {selectedEvaluation.juryName}
                </h2>
                <div className="text-sm text-gray-600">
                  Submission: {selectedEvaluation.submissionTitle}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-md
                  ${selectedEvaluation.evaluationMethod === 'checkbox' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-green-100 text-green-800'}`
                }>
                  {selectedEvaluation.evaluationMethod === 'checkbox' ? 'Checkbox Evaluation' : 'Score Evaluation'}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-md
                  ${selectedEvaluation.isFinalized
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-amber-100 text-amber-800'}`
                }>
                  {selectedEvaluation.isFinalized ? 'Finalized' : 'In Progress'}
                </span>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              {selectedEvaluation.evaluationMethod === 'scoring' ? (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Scores</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-md border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Design Content (40%)</div>
                      <div className="text-lg font-bold text-gray-900">{selectedEvaluation.score1 || 'N/A'}</div>
                    </div>
                    <div className="bg-white p-3 rounded-md border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Color Application (30%)</div>
                      <div className="text-lg font-bold text-gray-900">{selectedEvaluation.score2 || 'N/A'}</div>
                    </div>
                    <div className="bg-white p-3 rounded-md border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Technological Content (20%)</div>
                      <div className="text-lg font-bold text-gray-900">{selectedEvaluation.score3 || 'N/A'}</div>
                    </div>
                    <div className="bg-white p-3 rounded-md border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Innovative Solution (10%)</div>
                      <div className="text-lg font-bold text-gray-900">{selectedEvaluation.score4 || 'N/A'}</div>
                    </div>
                  </div>
                  
                  {/* Weighted score calculation */}
                  {selectedEvaluation.score1 && selectedEvaluation.score2 && 
                   selectedEvaluation.score3 && selectedEvaluation.score4 && (
                    <div className="mt-4 bg-primary/10 p-3 rounded-md border border-primary/20">
                      <h4 className="text-sm font-medium text-primary mb-1">Weighted Score</h4>
                      <div className="text-xl font-bold text-gray-900">
                        {(selectedEvaluation.score1 * 4) + 
                         (selectedEvaluation.score2 * 3) + 
                         (selectedEvaluation.score3 * 2) + 
                         (selectedEvaluation.score4 * 1)}
                        <span className="text-sm font-normal text-gray-500 ml-1">/100</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-3 rounded-md border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2">Selection Status</h3>
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full ${selectedEvaluation.selected ? 'bg-green-500' : 'bg-red-500'} mr-2`}>
                      {selectedEvaluation.selected ? (
                        <Check className="h-4 w-4 text-white m-1" />
                      ) : (
                        <X className="h-4 w-4 text-white m-1" />
                      )}
                    </div>
                    <span className="text-gray-900">
                      {selectedEvaluation.selected ? 'Selected for Top Submissions' : 'Not Selected'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Submission Description section */}
            {selectedEvaluation.submissionDescription && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Submission Description</h3>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-line">{selectedEvaluation.submissionDescription}</p>
                </div>
              </div>
            )}
            
            {/* Comments section */}
            {selectedEvaluation.comments && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Jury Comments</h3>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-line">{selectedEvaluation.comments}</p>
                </div>
              </div>
            )}
            
            {/* File Preview */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-900">Submission Files</h3>
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
                  <span className="text-sm text-gray-600">
                    {currentFileIndex + 1} of {getTotalFiles()}
                  </span>
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
                </div>
              </div>
            </div>
            
            {/* Main file preview iframe */}
            <div className="h-[500px] flex items-center justify-center">
              {getCurrentFileUrl() ? (
                <iframe
                  src={getCurrentFileUrl()}
                  className="w-full h-full"
                  title="Submission file preview"
                ></iframe>
              ) : (
                <div className="text-center text-gray-500">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>File not available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render grid view for submissions
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubmissions.map((submission) => (
          <div 
            key={submission.id}
            className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all duration-200 cursor-pointer ${
              selectedSubmission?.id === submission.id
                ? "ring-2 ring-primary border-primary"
                : topFiveSelections.some(s => s.id === submission.id)
                  ? "ring-1 ring-amber-400 border-amber-400"
                  : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleSelectSubmission(submission)}
          >
            {/* Top Section with Thumbnail/Preview */}
            <div className="relative h-40 bg-gray-100 flex items-center justify-center">
              {submission.submissionFile ? (
                <iframe 
                  src={submission.submissionFile}
                  className="w-full h-full"
                  title={submission.title}
                ></iframe>
              ) : (
                <FileText className="h-12 w-12 text-gray-400" />
              )}
              
              {/* Top 5 indicator */}
              {topFiveSelections.some(s => s.id === submission.id) && (
                <div className="absolute top-2 right-2 bg-amber-400 text-white p-1 rounded-full">
                  <Star className="h-4 w-4 fill-white" />
                </div>
              )}
            </div>
            
            {/* Content Section */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {submission.title.length > 30 
                    ? submission.title.substring(0, 30) + "..." 
                    : submission.title}
                </h3>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                  ID: {submission.submissionId.substring(0, 8)}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {submission.categoryName || "Uncategorized"}
                </span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                {submission.description || "No description provided."}
              </p>
              
              <div className="flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleTopFive(submission);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                    topFiveSelections.some(s => s.id === submission.id)
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {topFiveSelections.some(s => s.id === submission.id) ? (
                    <>
                      <Star className="h-3 w-3 fill-amber-500" />
                      Remove from Top 5
                    </>
                  ) : (
                    <>
                      <Star className="h-3 w-3" />
                      Add to Top 5
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render list view for submissions
  const renderListView = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  className="flex items-center"
                  onClick={() => {
                    setSortBy("title");
                    toggleSortDirection();
                  }}
                >
                  Submission
                  {sortBy === "title" && (
                    sortDirection === "asc" 
                      ? <ChevronUp className="ml-1 h-4 w-4" />
                      : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  className="flex items-center"
                  onClick={() => {
                    setSortBy("category");
                    toggleSortDirection();
                  }}
                >
                  Category
                  {sortBy === "category" && (
                    sortDirection === "asc" 
                      ? <ChevronUp className="ml-1 h-4 w-4" />
                      : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  className="flex items-center"
                  onClick={() => {
                    setSortBy("date");
                    toggleSortDirection();
                  }}
                >
                  Date
                  {sortBy === "date" && (
                    sortDirection === "asc" 
                      ? <ChevronUp className="ml-1 h-4 w-4" />
                      : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Top 5
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubmissions.map((submission) => (
              <tr 
                key={submission.id} 
                className={`hover:bg-gray-50 cursor-pointer ${
                  selectedSubmission?.id === submission.id ? "bg-primary/5" : ""
                }`}
                onClick={() => handleSelectSubmission(submission)}
              >
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
                      <div className="text-xs text-gray-500">
                        ID: {submission.submissionId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {submission.categoryName || "Uncategorized"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-xs text-gray-500">
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleTopFive(submission);
                    }}
                    className={`inline-flex items-center justify-center p-1 rounded-full ${
                      topFiveSelections.some(s => s.id === submission.id)
                        ? "bg-amber-100 text-amber-500 hover:bg-amber-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                    aria-label={topFiveSelections.some(s => s.id === submission.id) ? "Remove from top 5" : "Add to top 5"}
                  >
                    <Star className={`h-4 w-4 ${topFiveSelections.some(s => s.id === submission.id) ? "fill-amber-500" : ""}`} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm z-30 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* <Link 
                href="/admin/dashboard" 
                className="flex items-center gap-1 text-black bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors shadow-sm"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="font-medium">Back</span>
              </Link> */}
              
              <div className="flex items-center space-x-3">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Top 5 Submissions Management
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={topFiveSelections.length === 0}
                className={`flex items-center gap-1 px-3 py-2 rounded-md transition-colors ${
                  topFiveSelections.length === 0
                    ? "bg-gray-300 cursor-not-allowed text-gray-500"
                    : "bg-primary hover:bg-primary/90 text-white"
                }`}
              >
                <Star className="h-4 w-4" />
                <span>Save Top 5</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Selected Top 5 Bar */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex items-center mb-3 sm:mb-0">
              <Star className="h-5 w-5 text-amber-500 mr-2" />
              <h2 className="text-amber-800 font-medium">Final Top 5 Selections: {topFiveSelections.length}/{MAX_TOP_SELECTIONS}</h2>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {topFiveSelections.length > 0 ? (
                topFiveSelections.map((selection, index) => (
                  <div key={selection.id} className="flex items-center bg-white px-2 py-1 rounded-md border border-amber-200 text-sm">
                    <span className="text-amber-600 mr-1 font-medium">#{index + 1}</span>
                    <span className="text-gray-800 truncate max-w-32">{selection.title}</span>
                    <button 
                      onClick={() => handleToggleTopFive(selection)}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-amber-600 text-sm">No selections yet. Add submissions to your Top 5.</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Admin Info Bar */}
          <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-medium text-gray-800">Admin Control Panel</h2>
                  <p className="text-sm text-gray-600">
                    Select the top 5 submissions that will be featured on the website.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-md flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>Total Submissions: <span className="font-bold">{submissions.length}</span></span>
                </div>
                
                <div className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-md flex items-center gap-1">
                  <Medal className="h-4 w-4" />
                  <span>Jury Evaluations: <span className="font-bold">{juryEvaluations.length}</span></span>
                </div>
                
                <div className="text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-md flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  <span>Changes publish immediately</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filter and Controls */}
          <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
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
              
              {/* Category Filter */}
              <div className="w-full md:w-48">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-800"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Sort By */}
              <div className="w-full md:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "date" | "title" | "category")}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-800"
                >
                  <option value="date">Sort by: Date</option>
                  <option value="title">Sort by: Title</option>
                  <option value="category">Sort by: Category</option>
                </select>
              </div>
              
              {/* Sort Direction */}
              <button
                onClick={toggleSortDirection}
                className="px-3 py-2 border border-gray-300 rounded-md flex items-center gap-1 text-gray-700 hover:bg-gray-50"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortDirection === "asc" ? "Ascending" : "Descending"}
              </button>
              
              {/* View Toggle */}
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 ${
                    viewMode === "grid"
                      ? "bg-primary text-white"
                      : "bg-white text-gray-700 border border-gray-300"
                  } ${viewMode === "evaluations" ? "rounded-l-md" : ""}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 ${
                    viewMode === "list"
                      ? "bg-primary text-white"
                      : "bg-white text-gray-700 border border-r border-t border-b border-gray-300"
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode("evaluations")}
                  className={`px-4 py-2 rounded-r-md ${
                    viewMode === "evaluations"
                      ? "bg-primary text-white"
                      : "bg-white text-gray-700 border border-r border-t border-b border-gray-300"
                  }`}
                >
                  Jury Evaluations
                </button>
              </div>
            </div>
            
            {/* Clear filters button */}
            {(searchQuery || filterCategory !== "all" || sortBy !== "date" || sortDirection !== "desc") && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear filters
                </button>
              </div>
            )}
          </div>
          
          {/* Notification Messages */}
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
              <Check className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>{successMessage}</p>
            </div>
          )}
          
          {/* Results count and info */}
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {viewMode === "evaluations" 
                ? `Showing ${juryEvaluations.length} jury evaluations` 
                : `Showing ${filteredSubmissions.length} submissions`}
            </div>
            
            <div className="text-sm text-gray-600">
              {topFiveSelections.length} of {MAX_TOP_SELECTIONS} selected
            </div>
          </div>
          
          {/* Content Grid or List View */}
          {isLoading ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading submissions...</p>
            </div>
          ) : viewMode === "evaluations" ? (
            renderEvaluationsView()
          ) : (
            <>
              {filteredSubmissions.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                  <ListFilter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No submissions found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search or filters to find what you're looking for.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-primary text-white rounded-md"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="mb-6">
                  {viewMode === "grid" 
                    ? renderGridView() 
                    : viewMode === "list" 
                      ? renderListView() 
                      : renderTop5View()}
                </div>
              )}
            </>
          )}
          
          {/* Selected Submission Preview */}
          {selectedSubmission && (
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header with submission title and actions */}
              <div className="p-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedSubmission.title}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {selectedSubmission.categoryName || "Uncategorized"}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs">
                      ID: {selectedSubmission.submissionId}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleToggleTopFive(selectedSubmission)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md ${
                    topFiveSelections.some(s => s.id === selectedSubmission.id)
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  <Star className={`h-4 w-4 ${topFiveSelections.some(s => s.id === selectedSubmission.id) ? "fill-white" : ""}`} />
                  <span>
                    {topFiveSelections.some(s => s.id === selectedSubmission.id)
                      ? "Remove from Top 5"
                      : "Add to Top 5"}
                  </span>
                </button>
              </div>
              
              {/* Description */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <div className="relative">
                  <div className={`text-gray-700 text-sm ${
                    showFullDescription ? 'max-h-none' : 'max-h-20 overflow-hidden'
                  }`}>
                    <p className="whitespace-pre-line">{selectedSubmission.description || "No description provided."}</p>
                  </div>
                  
                  {/* Gradient fade effect when collapsed */}
                  {!showFullDescription && selectedSubmission.description && selectedSubmission.description.length > 300 && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent z-10"></div>
                  )}
                  
                  {/* Show more/less button */}
                  {selectedSubmission.description && selectedSubmission.description.length > 300 && (
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
                  )}
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
              
              {/* File thumbnails for multiple files */}
              {getTotalFiles() > 1 && (
                <div className="flex overflow-x-auto py-4 px-4 bg-gray-50 border-b border-gray-200 gap-4">
                  {selectedSubmission?.submissionFile && (
                    <div
                      onClick={() => setCurrentFileIndex(0)}
                      className={`flex-shrink-0 cursor-pointer group ${currentFileIndex === 0
                        ? "opacity-100"
                        : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className={`w-36 h-24 rounded-lg overflow-hidden border-2 ${currentFileIndex === 0
                        ? "border-primary"
                        : "border-gray-200 group-hover:border-gray-300"
                      }`}>
                        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                          <FileText className={`h-8 w-8 ${currentFileIndex === 0 ? "text-primary" : "text-gray-400"}`} />
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-center text-gray-600">Main File</div>
                    </div>
                  )}
                  
                  {selectedSubmission?.submissionFiles?.map((fileUrl, idx) => {
                    const adjustedIdx = selectedSubmission.submissionFile ? idx + 1 : idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setCurrentFileIndex(adjustedIdx)}
                        className={`flex-shrink-0 cursor-pointer group ${currentFileIndex === adjustedIdx
                          ? "opacity-100"
                          : "opacity-70 hover:opacity-100"
                        }`}
                      >
                        <div className={`w-36 h-24 rounded-lg overflow-hidden border-2 ${currentFileIndex === adjustedIdx
                          ? "border-primary"
                          : "border-gray-200 group-hover:border-gray-300"
                        }`}>
                          <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                            <FileText className={`h-8 w-8 ${currentFileIndex === adjustedIdx ? "text-primary" : "text-gray-400"}`} />
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-center text-gray-600">File {idx + 1}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Main file preview */}
              <div className="h-[600px] flex items-center justify-center">
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
          )}
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-200">
            <div className="flex items-center justify-center mb-4">
              <div className="p-2 bg-amber-100 rounded-full">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold mb-4 text-gray-900 text-center">Confirm Top 5 Selections</h3>
            
            <p className="text-gray-600 mb-6 text-center">
              Are you sure you want to save these as the official top 5 selections? This will be displayed on the website.
            </p>
            
            {/* Show the current selections */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Your selections:</h4>
              {topFiveSelections.length > 0 ? (
                <ul className="space-y-2">
                  {topFiveSelections.map((selection, index) => (
                    <li key={selection.id} className="flex items-center text-sm">
                      <span className="w-6 h-6 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mr-2 font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-800">{selection.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No selections made yet.</p>
              )}
            </div>
            
            {topFiveSelections.length < MAX_TOP_SELECTIONS && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-amber-500" />
                <p className="text-amber-800 text-sm">
                  You've only selected {topFiveSelections.length} out of {MAX_TOP_SELECTIONS} possible submissions. Are you sure you want to proceed with fewer than 5 selections?
                </p>
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
                onClick={handleSaveTopFive}
                disabled={isSubmitting || topFiveSelections.length === 0}
                className={`px-4 py-2 rounded-md transition-colors ${
                  isSubmitting || topFiveSelections.length === 0
                    ? "bg-gray-300 cursor-not-allowed text-gray-500"
                    : "bg-primary hover:bg-primary/90 text-white"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}