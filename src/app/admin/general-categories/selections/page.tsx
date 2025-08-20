"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Trophy,
  Download,
  ExternalLink,
  Info,
  Clock,
  CheckCircle,
  Plus,
  Minus,
  Save,
  AlertCircle,
  ArrowLeft,
  Filter,
  Users,
  Award
} from "lucide-react";

// Types for our submission data
interface Submission {
  id: string;
  title: string;
  description: string;
  status: string;
  submittedAt: string;
  categoryId: string;
  categoryName: string;
  submissionId: string;
  submissionType: string;
  submissionFile?: string;
  submissionFiles?: string[];
  isSelected: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function GeneralCategoriesSelectionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedSubmissions, setSelectedSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch submissions and categories
  useEffect(() => {
    fetchData();
  }, [selectedCategoryId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      const response = await fetch(`/api/admin/general-categories/selections?categoryId=${selectedCategoryId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000)
      });
      
      if (response.status === 401) {
        router.push('/login?redirectTo=/admin/general-categories/selections');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSubmissions(data.submissions);
        setCategories(data.categories);
        
        // Set currently selected submissions based on existing selections
        const currentlySelected = data.submissions.filter((s: Submission) => s.isSelected);
        setSelectedSubmissions(currentlySelected);
      } else {
        throw new Error(data.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setErrorMessage("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmissionToggle = (submission: Submission) => {
    const isCurrentlySelected = selectedSubmissions.some(s => s.id === submission.id);
    
    if (isCurrentlySelected) {
      // Remove from selection
      setSelectedSubmissions(prev => prev.filter(s => s.id !== submission.id));
    } else {
      // Add to selection
      setSelectedSubmissions(prev => [...prev, submission]);
    }
  };

  const moveSubmissionUp = (index: number) => {
    if (index > 0) {
      const newSelections = [...selectedSubmissions];
      [newSelections[index], newSelections[index - 1]] = [newSelections[index - 1], newSelections[index]];
      setSelectedSubmissions(newSelections);
    }
  };

  const moveSubmissionDown = (index: number) => {
    if (index < selectedSubmissions.length - 1) {
      const newSelections = [...selectedSubmissions];
      [newSelections[index], newSelections[index + 1]] = [newSelections[index + 1], newSelections[index]];
      setSelectedSubmissions(newSelections);
    }
  };

  const handleSaveSelections = async () => {
    if (selectedCategoryId === "all") {
      setErrorMessage("Please select a specific category before saving selections.");
      return;
    }

    if (selectedSubmissions.length === 0) {
      setErrorMessage("Please select at least one submission.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      const response = await fetch('/api/admin/general-categories/selections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId: selectedCategoryId,
          submissions: selectedSubmissions
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login?redirectTo=/admin/general-categories/selections');
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save selections');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(data.message);
        // Refresh data to show updated selections
        fetchData();
      } else {
        throw new Error(data.message || 'Failed to save selections');
      }
    } catch (error) {
      console.error("Error saving selections:", error);
      setErrorMessage(error instanceof Error ? error.message : "An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex-1 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <h2 className="text-xl font-semibold mb-2 text-black">Loading Submissions</h2>
          <p className="text-gray-600">Please wait while we fetch the submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">General Categories - Select Submissions</h1>
                <p className="text-gray-600 text-sm">
                  Choose submissions for jury evaluation (flexible quantity)
                </p>
              </div>
            </div>
            
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Admin</span>
            </Link>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0 mr-3" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">Selection Instructions</h3>
              <p className="text-blue-700 text-sm">
                1. Select a category to filter submissions<br/>
                2. Click on submissions to select them for jury evaluation<br/>
                3. Arrange the order by using up/down buttons (this determines ranking)<br/>
                4. Save selections to proceed to scoring phase
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <div className="flex-1">
              <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Category
              </label>
              <select
                id="categoryFilter"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-800"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedSubmissions.length > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Selected: {selectedSubmissions.length}</div>
                <button
                  onClick={handleSaveSelections}
                  disabled={isSaving || selectedCategoryId === "all"}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-md mt-2 ${
                    isSaving || selectedCategoryId === "all"
                      ? "bg-gray-300 cursor-not-allowed text-gray-600"
                      : "bg-primary hover:bg-primary/90 text-white"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Selections</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-4 rounded-lg mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="text-green-600 text-sm bg-green-50 border border-green-200 p-4 rounded-lg mb-6 flex items-start">
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{successMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side - Available submissions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Available Submissions</h2>
                <p className="text-sm text-gray-600">Click to select for jury evaluation</p>
              </div>
              
              <div className="p-4">
                {submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Submissions Found</h3>
                    <p className="text-gray-600">No submissions found for the selected category.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {submissions.map((submission) => {
                      const isSelected = selectedSubmissions.some(s => s.id === submission.id);
                      
                      return (
                        <div
                          key={submission.id}
                          onClick={() => handleSubmissionToggle(submission)}
                          className={`cursor-pointer transition-all duration-200 rounded-lg border-2 p-4 ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                              {submission.title}
                            </h3>
                            {isSelected && (
                              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {submission.categoryName}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(submission.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {submission.submissionFile && (
                            <div className="h-20 bg-gray-100 rounded-md mb-2 overflow-hidden">
                              <iframe
                                src={submission.submissionFile}
                                className="w-full h-full pointer-events-none"
                                title={submission.title}
                              ></iframe>
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-600 line-clamp-2">
                            ID: {submission.submissionId}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Selected submissions order */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-primary">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Selected for Evaluation
                </h2>
                <p className="text-sm text-primary-100">
                  Order determines ranking ({selectedSubmissions.length} selected)
                </p>
              </div>
              
              <div className="p-4">
                {selectedSubmissions.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Selections</h3>
                    <p className="text-gray-600 text-sm">Select submissions from the left panel to add them here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedSubmissions.map((submission, index) => (
                      <div
                        key={submission.id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                              <span className="font-medium text-gray-900 text-sm line-clamp-1">
                                {submission.title}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {submission.categoryName}
                            </p>
                          </div>
                          
                          <div className="flex flex-col gap-1 ml-2">
                            <button
                              onClick={() => moveSubmissionUp(index)}
                              disabled={index === 0}
                              className={`p-1 rounded ${
                                index === 0
                                  ? "text-gray-300 cursor-not-allowed"
                                  : "text-gray-600 hover:text-primary hover:bg-primary/10"
                              }`}
                              title="Move up"
                            >
                              <ChevronLeft className="w-4 h-4 transform -rotate-90" />
                            </button>
                            <button
                              onClick={() => moveSubmissionDown(index)}
                              disabled={index === selectedSubmissions.length - 1}
                              className={`p-1 rounded ${
                                index === selectedSubmissions.length - 1
                                  ? "text-gray-300 cursor-not-allowed"
                                  : "text-gray-600 hover:text-primary hover:bg-primary/10"
                              }`}
                              title="Move down"
                            >
                              <ChevronRight className="w-4 h-4 transform rotate-90" />
                            </button>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleSubmissionToggle(submission)}
                          className="text-red-600 hover:text-red-800 text-xs flex items-center gap-1"
                        >
                          <Minus className="w-3 h-3" />
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {selectedSubmissions.length > 0 && (
              <div className="mt-4">
                <Link
                  href={`/admin/general-categories?categoryId=${selectedCategoryId}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Users className="h-5 w-5" />
                  Proceed to Jury Scoring
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}