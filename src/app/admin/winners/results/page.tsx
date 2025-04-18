"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FileSpreadsheet, 
  Download, 
  Trophy, 
  Medal, 
  AlertCircle, 
  Info,
  Users,
  ArrowLeftRight,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Filter,
  ArrowLeft,
  RefreshCw,
  Star,
  Calculator
} from "lucide-react";

interface Judge {
  id: string;
  name: string;
}

interface JudgeScore {
  juryId: string;
  juryName: string;
  score1: number;
  score2: number;
  score3: number;
  score4: number;
  weightedScore: number;
  comments: string;
}

interface FinalistResult {
  id: string;
  topFiveId: string;
  rank: number;
  title: string;
  submissionNumber: string;
  categoryName: string;
  judgeScores: (JudgeScore | null)[];
  averageScore: number | null;
}

export default function JuryResultsPage() {
  const router = useRouter();
  const tableRef = useRef<HTMLTableElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [results, setResults] = useState<FinalistResult[]>([]);
  const [showCriteria, setShowCriteria] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"rank" | "score">("score");
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  
  // Fetch results data
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        
        const response = await fetch('/api/admin/winners/results', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(15000)
        });
        
        if (response.status === 401) {
          router.push('/login?redirectTo=/admin/winners/results');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch jury results');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setJudges(data.judges);
          setResults(data.results);
          
          // Initialize show details state
          const initialShowDetails: Record<string, boolean> = {};
          data.results.forEach((result: FinalistResult) => {
            initialShowDetails[result.id] = false;
          });
          setShowDetails(initialShowDetails);
        } else {
          throw new Error(data.message || 'Failed to fetch jury results');
        }
      } catch (error) {
        console.error("Error fetching jury results:", error);
        setErrorMessage("Failed to load jury results. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [router]);
  
  // Toggle showing detailed criteria for each judge
  const toggleCriteria = () => {
    setShowCriteria(!showCriteria);
  };
  
  // Toggle sorting by rank or score
  const toggleSortBy = () => {
    setSortBy(sortBy === "rank" ? "score" : "rank");
    
    // Sort the results based on the new sort criteria
    if (sortBy === "rank") {
      // Already sorted by score (default), no need to re-sort
    } else {
      // Sort by original rank
      setResults([...results].sort((a, b) => a.rank - b.rank));
    }
  };
  
  // Toggle showing detailed breakdown for a finalist
  const toggleDetails = (finalistId: string) => {
    setShowDetails({
      ...showDetails,
      [finalistId]: !showDetails[finalistId]
    });
  };
  
  // Export table to Excel
  const exportToExcel = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    let headers = ["Rank", "Submission", "Category"];
    
    if (showCriteria) {
      // Add detailed criteria headers for each judge
      judges.forEach(judge => {
        headers.push(`${judge.name} - Design (40%)`);
        headers.push(`${judge.name} - Color (30%)`);
        headers.push(`${judge.name} - Tech (20%)`);
        headers.push(`${judge.name} - Innov (10%)`);
        headers.push(`${judge.name} - Total`);
      });
    } else {
      // Add just the total score for each judge
      judges.forEach(judge => {
        headers.push(judge.name);
      });
    }
    
    headers.push("Average");
    csvContent += headers.join(",") + "\r\n";
    
    // Add data rows
    results.forEach((result, index) => {
      let row = [
        (index + 1).toString(),
        `"${result.title}"`,
        `"${result.categoryName}"`
      ];
      
      if (showCriteria) {
        // Add detailed criteria scores for each judge
        result.judgeScores.forEach(judgeScore => {
          if (judgeScore) {
            row.push(judgeScore.score1.toString());
            row.push(judgeScore.score2.toString());
            row.push(judgeScore.score3.toString());
            row.push(judgeScore.score4.toString());
            row.push(judgeScore.weightedScore.toString());
          } else {
            row.push("","","","",""); // Empty cells for missing judge scores
          }
        });
      } else {
        // Add just the total score for each judge
        result.judgeScores.forEach(judgeScore => {
          if (judgeScore) {
            row.push(judgeScore.weightedScore.toString());
          } else {
            row.push(""); // Empty cell for missing judge score
          }
        });
      }
      
      // Add average score
      row.push(result.averageScore ? result.averageScore.toString() : "");
      
      csvContent += row.join(",") + "\r\n";
    });
    
    // Create and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jury-results-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex-1 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Jury Results</h2>
          <p className="text-gray-600">Please wait while we fetch and compile the data...</p>
        </div>
      </div>
    );
  }
  
  // Render error message
  if (errorMessage) {
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
      <div className="max-w-full mx-auto">
        {/* Header with actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-full">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Jury Evaluation Results</h1>
                <p className="text-gray-600 text-sm">
                  Complete results from all judges' evaluations of the final submissions
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/winners"
                className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Scoring</span>
              </Link>
              
              <button
                onClick={toggleCriteria}
                className="inline-flex items-center gap-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span>{showCriteria ? "Show Totals Only" : "Show All Criteria"}</span>
              </button>
              
              <button
                onClick={toggleSortBy}
                className="inline-flex items-center gap-1 px-3 py-2 bg-purple-50 border border-purple-200 rounded-md text-purple-700 hover:bg-purple-100 transition-colors"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span>Sort by {sortBy === "score" ? "Rank" : "Score"}</span>
              </button>
              
              <button
                onClick={exportToExcel}
                className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 rounded-md text-white hover:bg-green-700 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export to Excel</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Info card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0 mr-3" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">About Judging Criteria</h3>
              <p className="text-blue-700 text-sm">
                Submissions were evaluated on four criteria with different weights:
                <span className="font-medium"> Design Content (40%), Color Application (30%), 
                Technical Content (20%), and Innovative Solution (10%)</span>.
                The weighted total is out of 100 points.
              </p>
            </div>
          </div>
        </div>
        
        {/* No results message */}
        {results.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Judge Evaluations Yet</h3>
            <p className="text-gray-600 mb-4">
              There are no jury evaluations recorded for any finalist submissions yet.
            </p>
            <Link 
              href="/admin/winners"
              className="px-4 py-2 bg-primary text-white rounded-md inline-block font-medium"
            >
              Go to Jury Scoring
            </Link>
          </div>
        ) : (
          /* Results table */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table ref={tableRef} className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      Rank
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submission
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    
                    {showCriteria ? (
                      // Show detailed criteria columns for each judge
                      judges.map(judge => (
                        <React.Fragment key={judge.id}>
                          <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50 border-l border-gray-200">
                            <div className="truncate max-w-[100px] mx-auto">{judge.name}</div>
                            <div className="text-blue-600 text-[10px] normal-case font-normal">Design (40%)</div>
                          </th>
                          <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                            <div className="truncate max-w-[100px] mx-auto">{judge.name}</div>
                            <div className="text-blue-600 text-[10px] normal-case font-normal">Color (30%)</div>
                          </th>
                          <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                            <div className="truncate max-w-[100px] mx-auto">{judge.name}</div>
                            <div className="text-blue-600 text-[10px] normal-case font-normal">Tech (20%)</div>
                          </th>
                          <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                            <div className="truncate max-w-[100px] mx-auto">{judge.name}</div>
                            <div className="text-blue-600 text-[10px] normal-case font-normal">Innov (10%)</div>
                          </th>
                          <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50 border-r border-gray-200">
                            <div className="truncate max-w-[100px] mx-auto">{judge.name}</div>
                            <div className="text-blue-600 text-[10px] normal-case font-normal">Total</div>
                          </th>
                        </React.Fragment>
                      ))
                    ) : (
                      // Show just total score for each judge
                      judges.map(judge => (
                        <th key={judge.id} scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 border-x border-gray-200">
                          <div className="truncate max-w-[100px] mx-auto">{judge.name}</div>
                        </th>
                      ))
                    )}
                    
                    <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 border-l border-gray-200">
                      <div className="flex items-center justify-center gap-1">
                        <BarChart2 className="h-3 w-3" />
                        <span>Average</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <React.Fragment key={result.id}>
                      <tr 
                        className={`hover:bg-gray-50 cursor-pointer ${
                          index < 3 ? 'bg-yellow-50/30' : ''
                        }`}
                        onClick={() => toggleDetails(result.id)}
                      >
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                            index === 1 ? 'bg-gray-100 text-gray-800 border border-gray-300' :
                            index === 2 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-white text-gray-800 border border-gray-300'
                          }`}>
                            {index === 0 ? (
                              <Trophy className="h-4 w-4" />
                            ) : index === 1 || index === 2 ? (
                              <Medal className="h-4 w-4" />
                            ) : (
                              <span className="text-sm font-medium">{index + 1}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center">
                            <div className="font-medium text-gray-900">
                              {result.title}
                            </div>
                            <button 
                              className="ml-2 text-gray-400 hover:text-gray-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDetails(result.id);
                              }}
                            >
                              {showDetails[result.id] ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {result.submissionNumber}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {result.categoryName}
                          </span>
                        </td>
                        
                        {showCriteria ? (
                          // Show detailed criteria scores for each judge
                          result.judgeScores.map((judgeScore, judgeIndex) => (
                            <React.Fragment key={`judge-${judgeIndex}`}>
                              <td className="px-2 py-3 text-center whitespace-nowrap border-l border-gray-200 bg-blue-50/40">
                                {judgeScore ? (
                                  <span className="text-sm font-medium">{judgeScore.score1}</span>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-2 py-3 text-center whitespace-nowrap bg-blue-50/40">
                                {judgeScore ? (
                                  <span className="text-sm font-medium">{judgeScore.score2}</span>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-2 py-3 text-center whitespace-nowrap bg-blue-50/40">
                                {judgeScore ? (
                                  <span className="text-sm font-medium">{judgeScore.score3}</span>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-2 py-3 text-center whitespace-nowrap bg-blue-50/40">
                                {judgeScore ? (
                                  <span className="text-sm font-medium">{judgeScore.score4}</span>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-2 py-3 text-center whitespace-nowrap font-medium border-r border-gray-200 bg-blue-50/40">
                                {judgeScore ? (
                                  <span className="text-blue-700">{judgeScore.weightedScore}</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </React.Fragment>
                          ))
                        ) : (
                          // Show just total score for each judge
                          result.judgeScores.map((judgeScore, judgeIndex) => (
                            <td key={`judge-${judgeIndex}`} className="px-3 py-3 text-center whitespace-nowrap font-medium border-x border-gray-200 bg-gray-50/40">
                              {judgeScore ? (
                                <span className="text-blue-700">{judgeScore.weightedScore}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          ))
                        )}
                        
                        <td className="px-3 py-3 text-center whitespace-nowrap border-l border-gray-200 bg-yellow-50/50">
                          {result.averageScore !== null ? (
                            <div className={`text-base font-bold ${
                              index === 0 ? 'text-yellow-700' :
                              index === 1 ? 'text-gray-700' :
                              index === 2 ? 'text-amber-700' :
                              'text-blue-700'
                            }`}>
                              {result.averageScore.toFixed(1)}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                      
                      {/* Expanded details row */}
                      {showDetails[result.id] && (
                        <tr className="bg-gray-50">
                          <td colSpan={showCriteria ? 3 + (judges.length * 5) + 1 : 3 + judges.length + 1} className="p-4 border-t border-gray-200">
                            <div className="max-w-4xl mx-auto">
                              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                <Calculator className="h-4 w-4 mr-1" />
                                Score Breakdown for {result.title}
                              </h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Score breakdown for each judge */}
                                {result.judgeScores.map((judgeScore, idx) => {
                                  if (!judgeScore) return null;
                                  
                                  return (
                                    <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                      <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
                                        <span className="font-medium text-gray-700">{judgeScore.juryName}</span>
                                        <span className="text-sm bg-blue-100 px-2 py-0.5 rounded-full text-blue-800 font-medium">
                                          Total: {judgeScore.weightedScore}
                                        </span>
                                      </div>
                                      <div className="p-3">
                                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                          <div className="text-gray-600">Design Content (40%):</div>
                                          <div className="font-medium text-gray-800">{judgeScore.score1} × 4 = {judgeScore.score1 * 4}</div>
                                          
                                          <div className="text-gray-600">Color Application (30%):</div>
                                          <div className="font-medium text-gray-800">{judgeScore.score2} × 3 = {judgeScore.score2 * 3}</div>
                                          
                                          <div className="text-gray-600">Tech. Content (20%):</div>
                                          <div className="font-medium text-gray-800">{judgeScore.score3} × 2 = {judgeScore.score3 * 2}</div>
                                          
                                          <div className="text-gray-600">Innovative Sol. (10%):</div>
                                          <div className="font-medium text-gray-800">{judgeScore.score4} × 1 = {judgeScore.score4 * 1}</div>
                                        </div>
                                        
                                        {judgeScore.comments && (
                                          <div className="mt-2 text-xs">
                                            <div className="font-medium text-gray-700 mb-1">Comments:</div>
                                            <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-700">
                                              {judgeScore.comments}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Summary footer */}
            <div className="bg-amber-50 p-4 border-t border-amber-200">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  <span className="text-amber-800 font-medium">
                    {results.length} finalists scored by {judges.length} judges
                  </span>
                </div>
                
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-gray-600">
                    First place average score: {results[0]?.averageScore?.toFixed(1) || "N/A"}
                  </span>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Refresh</span>
                  </button>
                  
                  <button
                    onClick={exportToExcel}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 rounded-md text-white hover:bg-green-700 transition-colors text-sm"
                  >
                    <Download className="h-3 w-3" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}