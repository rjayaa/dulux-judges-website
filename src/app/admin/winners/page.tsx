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
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowLeft,
  BarChart2,
  Check,
  Save,
  Award,
  Users,
  PlusCircle,
  Trash,
  Edit,
  UserCheck
} from "lucide-react";

// Types for our finalist data
interface Judge {
  id: string;
  fullName: string;
}

interface JudgeScore {
  id: string;
  name: string;
  finalScoreId: string;
  scores: {
    score1: string;
    score2: string;
    score3: string;
    score4: string;
  };
  comments: string;
  createdAt: string;
  updatedAt: string;
}

interface Finalist {
  id: string;
  topFiveId: string;
  title: string;
  description: string;
  submissionNumber: string;
  categoryId: string;
  categoryName: string;
  submittedAt: string;
  submissionType: string;
  submissionFile?: string;
  submissionFiles?: string[];
  judges: JudgeScore[];
}

export default function AdminFinalistScoringPage() {
  const router = useRouter();
  const [finalists, setFinalists] = useState<Finalist[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [selectedFinalist, setSelectedFinalist] = useState<Finalist | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [selectedJudgeId, setSelectedJudgeId] = useState<string>("");
  const [scores, setScores] = useState({
    score1: "",
    score2: "",
    score3: "",
    score4: ""
  });
  const [comments, setComments] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editScoreId, setEditScoreId] = useState<string | null>(null);
  
  // Fetch finalists and judges
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        
        const response = await fetch('/api/admin/winners', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(15000)
        });
        
        if (response.status === 401) {
          router.push('/login?redirectTo=/admin/winners');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setFinalists(data.finalists);
          setJudges(data.judges);
          
          // Set initial selected finalist
          if (data.finalists.length > 0) {
            setSelectedFinalist(data.finalists[0]);
          }
          
          // Reset form
          resetForm();
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
    
    fetchData();
  }, [router]);
  
  const resetForm = () => {
    setSelectedJudgeId("");
    setScores({
      score1: "",
      score2: "",
      score3: "",
      score4: ""
    });
    setComments("");
    setEditMode(false);
    setEditScoreId(null);
  };
  
  const handleSelectFinalist = (finalist: Finalist) => {
    setSelectedFinalist(finalist);
    setCurrentFileIndex(0);
    setShowFullDescription(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    resetForm();
  };
  
  const handleEditScore = (judgeScore: JudgeScore) => {
    setSelectedJudgeId(judgeScore.id);
    setScores(judgeScore.scores);
    setComments(judgeScore.comments);
    setEditMode(true);
    setEditScoreId(judgeScore.finalScoreId);
  };
  
    const handleDeleteScore = async (judgeId: string, scoreId: string) => {
    if (!confirm("Are you sure you want to delete this score?")) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      
      const response = await fetch('/api/admin/winners/results', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scoreId })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login?redirectTo=/admin/winners');
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete score');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update UI to reflect deletion
        if (selectedFinalist) {
          const updatedFinalist = {
            ...selectedFinalist,
            judges: selectedFinalist.judges.filter(j => j.finalScoreId !== scoreId)
          };
          
          setSelectedFinalist(updatedFinalist);
          
          setFinalists(prev => prev.map(f =>
            f.id === updatedFinalist.id ? updatedFinalist : f
          ));
        }
        
        setSuccessMessage("Score deleted successfully");
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        throw new Error(data.message || 'Failed to delete score');
      }
    } catch (error) {
      console.error("Error deleting score:", error);
      setErrorMessage(error instanceof Error ? error.message : "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getCurrentFileUrl = () => {
    if (!selectedFinalist) return "";
    
    if (selectedFinalist.submissionFile && currentFileIndex === 0) {
      return selectedFinalist.submissionFile;
    }
    
    if (selectedFinalist.submissionFiles && selectedFinalist.submissionFiles.length > 0) {
      const adjustedIndex = selectedFinalist.submissionFile ? currentFileIndex - 1 : currentFileIndex;
      if (adjustedIndex >= 0 && adjustedIndex < selectedFinalist.submissionFiles.length) {
        return selectedFinalist.submissionFiles[adjustedIndex];
      }
    }
    
    return "";
  };
  
  const getTotalFiles = () => {
    if (!selectedFinalist) return 0;
    
    let count = 0;
    if (selectedFinalist.submissionFile) count++;
    if (selectedFinalist.submissionFiles) count += selectedFinalist.submissionFiles.length;
    
    return count;
  };
  
  const handleNextFile = () => {
    if (!selectedFinalist || currentFileIndex >= getTotalFiles() - 1) return;
    setCurrentFileIndex(prev => prev + 1);
  };
  
  const handlePrevFile = () => {
    if (currentFileIndex > 0) {
      setCurrentFileIndex(prev => prev - 1);
    }
  };
  
  const handleNextFinalist = () => {
    if (!selectedFinalist) return;
    
    const currentIndex = finalists.findIndex(f => f.id === selectedFinalist.id);
    if (currentIndex >= 0 && currentIndex < finalists.length - 1) {
      handleSelectFinalist(finalists[currentIndex + 1]);
    }
  };
  
  const handlePrevFinalist = () => {
    if (!selectedFinalist) return;
    
    const currentIndex = finalists.findIndex(f => f.id === selectedFinalist.id);
    if (currentIndex > 0) {
      handleSelectFinalist(finalists[currentIndex - 1]);
    }
  };
  
  const handleSaveScores = async () => {
    if (!selectedFinalist || !selectedJudgeId) {
      setErrorMessage("Please select a judge");
      return;
    }
    
    // Validate scores
    if (!scores.score1 || !scores.score2 || !scores.score3 || !scores.score4) {
      setErrorMessage("Please fill in all score fields");
      return;
    }
    
    // Check score ranges
    const allScoreValues = Object.values(scores).map(score => parseInt(score));
    
    for (const score of allScoreValues) {
      if (isNaN(score) || score < 1 || score > 10) {
        setErrorMessage("All scores must be between 1 and 10");
        return;
      }
    }
    
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      const response = await fetch('/api/admin/winners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: selectedFinalist.id,
          juryId: selectedJudgeId,
          scores,
          comments
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login?redirectTo=/admin/winners');
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save scores');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage("Scores saved successfully!");
        
        // Find the judge name
        const judgeName = judges.find(j => j.id === selectedJudgeId)?.fullName || "Unknown Judge";
        
        // Create a new judge score object
        const newJudgeScore: JudgeScore = {
          id: selectedJudgeId,
          name: judgeName,
          finalScoreId: editScoreId || `temp_${Date.now()}`,
          scores,
          comments,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Update the finalist in the state
        if (selectedFinalist) {
          let updatedJudges: JudgeScore[];
          
          if (editMode && editScoreId) {
            // Update existing score
            updatedJudges = selectedFinalist.judges.map(j =>
              j.finalScoreId === editScoreId ? newJudgeScore : j
            );
          } else {
            // Add new score
            updatedJudges = [...selectedFinalist.judges, newJudgeScore];
          }
          
          const updatedFinalist = {
            ...selectedFinalist,
            judges: updatedJudges
          };
          
          setSelectedFinalist(updatedFinalist);
          
          // Update in the finalists list
          setFinalists(prev => prev.map(f =>
            f.id === updatedFinalist.id ? updatedFinalist : f
          ));
        }
        
        // Reset form
        resetForm();
      } else {
        throw new Error(data.message || 'Failed to save scores');
      }
    } catch (error) {
      console.error("Error saving scores:", error);
      setErrorMessage(error instanceof Error ? error.message : "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate total weighted score
  const calculateTotalScore = (scores: { score1: string, score2: string, score3: string, score4: string }) => {
    if (!scores.score1 || !scores.score2 || !scores.score3 || !scores.score4) return null;
    
    return (
      (parseInt(scores.score1) * 4) +
      (parseInt(scores.score2) * 3) +
      (parseInt(scores.score3) * 2) +
      (parseInt(scores.score4) * 1)
    );
  };
  
  // Calculate average total score across all judges for a finalist
  const calculateAverageScore = (judges: JudgeScore[]) => {
    if (judges.length === 0) return null;
    
    const totalScores = judges
      .map(j => calculateTotalScore(j.scores))
      .filter(score => score !== null) as number[];
    
    if (totalScores.length === 0) return null;
    
    const sum = totalScores.reduce((acc, score) => acc + score, 0);
    return (sum / totalScores.length).toFixed(1);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex-1 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Finalists</h2>
          <p className="text-gray-600">Please wait while we fetch the top 5 submissions...</p>
        </div>
      </div>
    );
  }
  
  // Render error message
  if (errorMessage && !selectedFinalist) {
    return (
      <div className="flex-1 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-auto p-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Instructions Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0 mr-3" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">Manual Score Entry for Finalists</h3>
              <p className="text-blue-700 text-sm">
                Select a finalist, choose a judge, and enter their scores for each criterion.
                These scores will determine the final winners of the competition.
              </p>
            </div>
          </div>
        </div>
        
        {/* Finalists list */}
        {finalists.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Finalists Selected Yet</h3>
            <p className="text-gray-600 mb-4">
              The Top 5 submissions have not been selected yet. Please go to the Top 5 Selections page to select finalists.
            </p>
            <Link
              href="/admin/top-five"
              className="px-4 py-2 bg-primary text-white rounded-md inline-block font-medium"
            >
              Go to Top 5 Selections
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {finalists.map((finalist, index) => (
              <div
                key={finalist.id}
                onClick={() => handleSelectFinalist(finalist)}
                className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md ${selectedFinalist?.id === finalist.id
                    ? "ring-2 ring-primary border-primary transform scale-[1.02]"
                    : finalist.judges.length > 0
                      ? "ring-1 ring-green-500 border-green-200"
                      : "border-gray-200"
                  }`}
              >
                {/* Finalist number */}
                <div className={`p-2 text-center font-semibold text-sm ${selectedFinalist?.id === finalist.id
                    ? "bg-primary text-white"
                    : finalist.judges.length > 0
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                  Finalist #{index + 1}
                  {finalist.judges.length > 0 && (
                    <span className="ml-2">
                      <UserCheck className="h-4 w-4 inline-block" />
                      <span className="ml-1">{finalist.judges.length}</span>
                    </span>
                  )}
                </div>
                
                {/* Thumbnail/preview */}
                <div className="h-32 bg-gray-100 flex items-center justify-center">
                  {finalist.submissionFile ? (
                    <iframe
                      src={finalist.submissionFile}
                      className="w-full h-full"
                      title={finalist.title}
                    ></iframe>
                  ) : (
                    <FileText className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                
                {/* Content */}
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                    {finalist.title}
                  </h3>
                  
                  {finalist.judges.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-1 mt-1 text-center">
                      <span className="text-green-800 text-xs font-medium">
                        Avg: {calculateAverageScore(finalist.judges) || "N/A"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Selected Finalist Preview and Scoring */}
        {selectedFinalist && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left side - Preview and details */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header with submission title */}
              <div className="p-4 border-b border-gray-200 bg-primary/5">
                <div className="flex flex-wrap justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedFinalist.title}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {selectedFinalist.categoryName}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(selectedFinalist.submittedAt).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs">
                        ID: {selectedFinalist.submissionNumber}
                      </span>
                    </div>
                  </div>
                  
                  {/* Average score badge */}
                  {selectedFinalist.judges.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
                      <div className="text-xs text-green-600 mb-1">Average Score</div>
                      <div className="text-xl font-bold text-green-700">
                        {calculateAverageScore(selectedFinalist.judges) || "N/A"}
                      </div>
                      <div className="text-xs text-green-600">
                        {selectedFinalist.judges.length} judge{selectedFinalist.judges.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Description */}
              <div className="p-4 bg-white border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <div className="relative">
                  <div className={`text-gray-700 text-sm ${showFullDescription ? 'max-h-none' : 'max-h-20 overflow-hidden'
                    }`}>
                    <p className="whitespace-pre-line">{selectedFinalist.description || "No description provided."}</p>
                  </div>
                  
                  {/* Gradient fade effect when collapsed */}
                  {!showFullDescription && selectedFinalist.description && selectedFinalist.description.length > 300 && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent z-10"></div>
                  )}
                  
                  {/* Show more/less button */}
                  {selectedFinalist.description && selectedFinalist.description.length > 300 && (
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
              
              {/* Judges' scores table */}
             {selectedFinalist.judges.length > 0 && (
                <div className="p-4 border-b border-gray-200 bg-primary/5">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Judges' Scores
                  </h3>
                  
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Judge
                          </th>
                          <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Design (40%)
                          </th>
                          <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Color (30%)
                          </th>
                          <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Tech (20%)
                          </th>
                          <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Innov (10%)
                          </th>
                          <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Total
                          </th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedFinalist.judges.map((judgeScore) => {
                          const totalScore = calculateTotalScore(judgeScore.scores);
                          return (
                            <tr key={judgeScore.finalScoreId} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-gray-800 font-medium">
                                {judgeScore.name}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="flex flex-col">
                                  <span className="text-gray-800">{judgeScore.scores.score1}</span>
                                  <span className="text-xs text-primary">({parseInt(judgeScore.scores.score1) * 4})</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="flex flex-col">
                                  <span className="text-gray-800">{judgeScore.scores.score2}</span>
                                  <span className="text-xs text-primary">({parseInt(judgeScore.scores.score2) * 3})</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="flex flex-col">
                                  <span className="text-gray-800">{judgeScore.scores.score3}</span>
                                  <span className="text-xs text-primary">({parseInt(judgeScore.scores.score3) * 2})</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className="flex flex-col">
                                  <span className="text-gray-800">{judgeScore.scores.score4}</span>
                                  <span className="text-xs text-primary">({parseInt(judgeScore.scores.score4) * 1})</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-center font-medium text-primary">
                                {totalScore}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-right">
                                <button
                                  onClick={() => handleEditScore(judgeScore)}
                                  className="p-1 text-gray-500 hover:text-primary"
                                  title="Edit score"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteScore(judgeScore.id, judgeScore.finalScoreId)}
                                  className="p-1 text-gray-500 hover:text-red-500 ml-1"
                                  title="Delete score"
                                >
                                  <Trash className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
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
              
              {/* File thumbnails gallery for all submitted files */}
              {getTotalFiles() > 1 && (
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">All Submitted Files</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {selectedFinalist.submissionFile && (
                      <div
                        onClick={() => setCurrentFileIndex(0)}
                        className={`cursor-pointer transition-all duration-200 ${currentFileIndex === 0 ? "transform scale-[1.03]" : ""
                          }`}
                      >
                        <div className={`aspect-[3/2] rounded-lg overflow-hidden border-2 ${currentFileIndex === 0
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-gray-200 hover:border-gray-300"
                          }`}>
                          <iframe
                            src={selectedFinalist.submissionFile}
                            className="w-full h-full pointer-events-none"
                            title="Main file preview"
                          ></iframe>
                        </div>
                        <div className="mt-1 text-xs text-center">
                          <span className={`px-2 py-0.5 rounded-full ${currentFileIndex === 0
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-700"
                            }`}>
                            Main File
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {selectedFinalist.submissionFiles?.map((fileUrl, idx) => {
                      const adjustedIdx = selectedFinalist.submissionFile ? idx + 1 : idx;
                      
                      // Get file extension for better visualization
                      const fileExt = fileUrl.split('.').pop()?.toLowerCase();
                      const isPdf = fileExt === 'pdf';
                      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(fileExt || '');
                      
                      return (
                        <div
                          key={idx}
                          onClick={() => setCurrentFileIndex(adjustedIdx)}
                          className={`cursor-pointer transition-all duration-200 ${currentFileIndex === adjustedIdx ? "transform scale-[1.03]" : ""
                            }`}
                        >
                          <div className={`aspect-[3/2] rounded-lg overflow-hidden border-2 ${currentFileIndex === adjustedIdx
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-gray-200 hover:border-gray-300"
                            }`}>
                            {isImage ? (
                              <div className="w-full h-full bg-black flex items-center justify-center">
                                <img
                                  src={fileUrl}
                                  alt={`File ${idx + 1}`}
                                  className="max-w-full max-h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling!.style.display = 'flex';
                                  }}
                                />
                                <div className="hidden items-center justify-center w-full h-full">
                                  <FileText className={`h-8 w-8 ${currentFileIndex === adjustedIdx ? "text-primary" : "text-gray-400"}`} />
                                </div>
                              </div>
                            ) : isPdf ? (
                              <iframe
                                src={fileUrl}
                                className="w-full h-full pointer-events-none"
                                title={`File ${idx + 1}`}
                              ></iframe>
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <FileText className={`h-8 w-8 ${currentFileIndex === adjustedIdx ? "text-primary" : "text-gray-400"}`} />
                              </div>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-center">
                            <span className={`px-2 py-0.5 rounded-full ${currentFileIndex === adjustedIdx
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-700"
                              }`}>
                              File {idx + 1}
                              {fileExt ? ` (.${fileExt})` : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Main file preview */}
              <div className="h-[500px] flex items-center justify-center">
                {getCurrentFileUrl() ? (
                  <iframe
                    src={getCurrentFileUrl()}
                    className="w-full h-full"
                    title={`Finalist submission file ${currentFileIndex + 1}`}
                  ></iframe>
                ) : (
                  <div className="text-center text-gray-500">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>File not available</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right side - Scoring form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-primary">
                  <h3 className="font-semibold text-lg text-white flex items-center">
                    <Trophy className="h-5 w-5 mr-2" />
                    {editMode ? "Edit Judge Score" : "Add Judge Score"}
                  </h3>
                </div>
                
                <div className="p-4">
                  {/* Judge Selection */}
                  <div className="mb-4">
                    <label htmlFor="judgeSelect" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Judge
                    </label>
                    <select
                      id="judgeSelect"
                      value={selectedJudgeId}
                      onChange={(e) => setSelectedJudgeId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-800"
                      disabled={editMode}
                    >
                      <option value="">-- Select a Judge --</option>
                      {judges.map((judge) => (
                        <option key={judge.id} value={judge.id}>
                          {judge.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Scoring instruction header */}
                  <div className="p-3 mb-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <Info className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Petunjuk Penilaian</h3>
                        <div className="mt-1 text-xs text-blue-700">
                          <p>Nilai setiap kriteria dengan skala 1-10, dengan 10 sebagai nilai tertinggi.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Scoring form */}
                  <div className="space-y-4">
                    {/* Score 1 */}
                    <div>
                      <label htmlFor="score1" className="block text-sm font-medium text-gray-700 mb-1">
                        1. Konten Desain / Design Content (40%)
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          id="score1"
                          min="1"
                          max="10"
                          value={scores.score1}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              // Clamp value between 1 and 10
                              const clampedValue = Math.min(Math.max(value, 1), 10);
                              setScores({ ...scores, score1: clampedValue.toString() });
                            } else {
                              setScores({ ...scores, score1: "" });
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === "" || isNaN(parseInt(e.target.value))) {
                              setScores({ ...scores, score1: "1" });
                            }
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-800"
                        />
                        <span className="ml-2 text-xs text-gray-500">(1-10)</span>
                      </div>
                    </div>
                    
                    {/* Score 2 */}
                    <div>
                      <label htmlFor="score2" className="block text-sm font-medium text-gray-700 mb-1">
                        2. Aplikasi Warna / Color Application (30%)
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          id="score2"
                          min="1"
                          max="10"
                          value={scores.score2}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              // Clamp value between 1 and 10
                              const clampedValue = Math.min(Math.max(value, 1), 10);
                              setScores({ ...scores, score2: clampedValue.toString() });
                            } else {
                              setScores({ ...scores, score2: "" });
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === "" || isNaN(parseInt(e.target.value))) {
                              setScores({ ...scores, score2: "1" });
                            }
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-800"
                        />
                        <span className="ml-2 text-xs text-gray-500">(1-10)</span>
                      </div>
                    </div>
                    
                    {/* Score 3 */}
                    <div>
                      <label htmlFor="score3" className="block text-sm font-medium text-gray-700 mb-1">
                        3. Konten Teknologi / Technological Content (20%)
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          id="score3"
                          min="1"
                          max="10"
                          value={scores.score3}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              // Clamp value between 1 and 10
                              const clampedValue = Math.min(Math.max(value, 1), 10);
                              setScores({ ...scores, score3: clampedValue.toString() });
                            } else {
                              setScores({ ...scores, score3: "" });
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === "" || isNaN(parseInt(e.target.value))) {
                              setScores({ ...scores, score3: "1" });
                            }
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-800"
                        />
                        <span className="ml-2 text-xs text-gray-500">(1-10)</span>
                      </div>
                    </div>
                    
                    {/* Score 4 */}
                    <div>
                      <label htmlFor="score4" className="block text-sm font-medium text-gray-700 mb-1">
                        4. Solusi Inovatif / Innovative Solution (10%)
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          id="score4"
                          min="1"
                          max="10"
                          value={scores.score4}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              // Clamp value between 1 and 10
                              const clampedValue = Math.min(Math.max(value, 1), 10);
                              setScores({ ...scores, score4: clampedValue.toString() });
                            } else {
                              setScores({ ...scores, score4: "" });
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === "" || isNaN(parseInt(e.target.value))) {
                              setScores({ ...scores, score4: "1" });
                            }
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-800"
                        />
                        <span className="ml-2 text-xs text-gray-500">(1-10)</span>
                      </div>
                    </div>
                    
                    {/* Total score calculation */}
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 mt-6">
                      <h4 className="text-sm font-medium text-primary mb-2">Total Score Calculation</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-600">Design Content (40%):</div>
                        <div className="font-medium text-gray-800">{scores.score1 ? parseInt(scores.score1) * 4 : "-"}</div>
                        
                        <div className="text-gray-600">Color Application (30%):</div>
                        <div className="font-medium text-gray-800">{scores.score2 ? parseInt(scores.score2) * 3 : "-"}</div>
                        
                        <div className="text-gray-600">Technological Content (20%):</div>
                        <div className="font-medium text-gray-800">{scores.score3 ? parseInt(scores.score3) * 2 : "-"}</div>
                        
                        <div className="text-gray-600">Innovative Solution (10%):</div>
                        <div className="font-medium text-gray-800">{scores.score4 ? parseInt(scores.score4) * 1 : "-"}</div>
                        
                        <div className="col-span-2 border-t border-gray-200 pt-2 mt-1"></div>
                        
                        <div className="text-primary font-semibold">TOTAL SCORE:</div>
                        <div className="text-primary font-bold text-xl">
                          {calculateTotalScore(scores) || "-"}/100
                        </div>
                      </div>
                    </div>
                    
                    {/* Comments */}
                    <div>
                      <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
                        Comments (optional)
                      </label>
                      <textarea
                        id="comments"
                        rows={3}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-800"
                        placeholder="Add any comments from the judge..."
                      ></textarea>
                    </div>
                    
                    {/* Error message */}
                    {errorMessage && (
                      <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-lg flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <p>{errorMessage}</p>
                      </div>
                    )}
                    
                    {/* Success message */}
                    {successMessage && (
                      <div className="text-green-600 text-sm bg-green-50 border border-green-200 p-3 rounded-lg flex items-start">
                        <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <p>{successMessage}</p>
                      </div>
                    )}
                    
                    {/* Action buttons */}
                    <div className="flex justify-between items-center pt-4">
                      <div className="flex gap-2">
                        <button
                          onClick={handlePrevFinalist}
                          disabled={finalists.findIndex(f => f.id === selectedFinalist.id) <= 0}
                          className={`p-2 rounded-md ${finalists.findIndex(f => f.id === selectedFinalist.id) <= 0
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                          title="Previous submission"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={handleNextFinalist}
                          disabled={finalists.findIndex(f => f.id === selectedFinalist.id) >= finalists.length - 1}
                          className={`p-2 rounded-md ${finalists.findIndex(f => f.id === selectedFinalist.id) >= finalists.length - 1
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                          title="Next submission"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="flex gap-2">
                        {editMode && (
                          <button
                            onClick={resetForm}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        )}
                        
                        <button
                          onClick={handleSaveScores}
                          disabled={isSubmitting || !selectedJudgeId || !scores.score1 || !scores.score2 || !scores.score3 || !scores.score4}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md ${isSubmitting || !selectedJudgeId || !scores.score1 || !scores.score2 || !scores.score3 || !scores.score4
                              ? "bg-gray-300 cursor-not-allowed text-gray-600"
                              : "bg-primary hover:bg-primary/90 text-white"
                            }`}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              <span>{editMode ? "Update Score" : "Save Score"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Final Rankings */}
              {finalists.filter(f => f.judges.length > 0).length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-6">
                  <div className="p-4 border-b border-gray-200 bg-amber-50">
                    <h3 className="font-semibold text-amber-800 flex items-center">
                      <Trophy className="h-5 w-5 mr-2 text-amber-600" />
                      Current Rankings (Based on Average Scores)
                    </h3>
                  </div>
                  
                  <div className="p-4">
                    <div className="space-y-2">
                      {finalists
                        .filter(f => f.judges.length > 0)
                        .sort((a, b) => {
                          const scoreA = parseFloat(calculateAverageScore(a.judges) || "0");
                          const scoreB = parseFloat(calculateAverageScore(b.judges) || "0");
                          return scoreB - scoreA; // Sort by score descending
                        })
                        .slice(0, 5) // Show top 5 at most
                        .map((finalist, index) => {
                          const avgScore = calculateAverageScore(finalist.judges);
                          return (
                            <div
                              key={finalist.id}
                              className={`flex items-center p-3 rounded-lg ${index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                                  index === 1 ? 'bg-gray-50 border border-gray-200' :
                                    index === 2 ? 'bg-amber-50 border border-amber-200' :
                                      'bg-white border border-gray-200'
                                }`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${index === 0 ? 'bg-yellow-400 text-white' :
                                  index === 1 ? 'bg-gray-300 text-gray-800' :
                                    index === 2 ? 'bg-amber-700 text-white' :
                                      'bg-blue-500 text-white'
                                }`}>
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate">{finalist.title}</h4>
                                <p className="text-xs text-gray-500">{finalist.categoryName} • {finalist.judges.length} judge{finalist.judges.length !== 1 ? 's' : ''}</p>
                              </div>
                              <div className={`px-3 py-1 rounded font-bold ${index === 0 ? 'text-yellow-800 bg-yellow-100' :
                                  index === 1 ? 'text-gray-800 bg-gray-100' :
                                    index === 2 ? 'text-amber-800 bg-amber-100' :
                                      'text-blue-800 bg-blue-100'
                                }`}>
                                {avgScore}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}