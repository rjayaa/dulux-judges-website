// src/components/EnhancedJudgingResults.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Info, 
  FileSpreadsheet, 
  Medal,
  Eye,
  EyeOff,
  BarChart2,
  Filter
} from "lucide-react";
import React from "react";

interface JudgeScore {
  juryId: string;
  juryName: string;
  score1: number; // Design Content (40%)
  score2: number; // Color Application (30%)
  score3: number; // Technological Content (20%)
  score4: number; // Innovative Solution (10%)
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

interface EnhancedJudgingResultsProps {
  results: FinalistResult[];
  judges: { id: string; name: string }[];
}

export default function EnhancedJudgingResults({ results, judges }: EnhancedJudgingResultsProps) {
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  // Set showFullBreakdown to true by default and remove the state since we won't toggle it
  const showFullBreakdown = true;
  const [sortBy, setSortBy] = useState<"rank" | "score">("score");
  
  // Calculate table data based on sorting
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      if (sortBy === "score") {
        // Sort by average score (highest first)
        if (!a.averageScore) return 1;
        if (!b.averageScore) return -1;
        return b.averageScore - a.averageScore;
      } else {
        // Sort by original rank
        return a.rank - b.rank;
      }
    });
  }, [results, sortBy]);

  // Toggle expanded view for a submission
  const toggleExpand = (id: string) => {
    if (expandedSubmission === id) {
      setExpandedSubmission(null);
    } else {
      setExpandedSubmission(id);
    }
  };
  
  // Toggle full breakdown view (shows all criteria)
  const toggleFullBreakdown = () => {
    setShowFullBreakdown(!showFullBreakdown);
  };
  
  // Toggle sorting method
  const toggleSortBy = () => {
    setSortBy(sortBy === "rank" ? "score" : "rank");
  };
  
  // Calculate criterion weight label
  const getCriterionLabel = (criterionNumber: number) => {
    switch (criterionNumber) {
      case 1: return "Design Content (40%)";
      case 2: return "Color Application (30%)";
      case 3: return "Technological Content (20%)";
      case 4: return "Innovative Solution (10%)";
      default: return "";
    }
  };
  
  // Calculate criterion weight multiplier
  const getCriterionMultiplier = (criterionNumber: number) => {
    switch (criterionNumber) {
      case 1: return 4; // 40%
      case 2: return 3; // 30%
      case 3: return 2; // 20%
      case 4: return 1; // 10%
      default: return 0;
    }
  };
  
  // Export to CSV
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Main headers
    const headers = [
      "Rank",
      "Submission",
      "Submission ID",
      "Category"
    ];
    
    // Add judge columns with criteria
    judges.forEach(judge => {
      // Add 5 columns for each judge (4 criteria + total)
      headers.push(`${judge.name}`, "", "", "", "");
    });
    
    headers.push("Average Score");
    csvContent += headers.join(",") + "\r\n";
    
    // Sub-headers for criteria
    const subHeaders = [
      "", // Rank
      "", // Submission
      "", // Submission ID
      "Criteria weights →" // Category
    ];
    
    // Add criteria sub-headers for each judge
    judges.forEach(() => {
      subHeaders.push(
        "Design 40%",
        "Color 30%",
        "Tech 20%",
        "Innov 10%",
        "Total"
      );
    });
    
    subHeaders.push("Out of 100");
    csvContent += subHeaders.join(",") + "\r\n";
    
    // Data rows
    sortedResults.forEach((result, index) => {
      const row = [
        (index + 1).toString(),
        `"${result.title}"`, // Add quotes to handle commas in titles
        result.submissionNumber,
        result.categoryName
      ];
      
      // Add scores for each judge
      judges.forEach((judge, judgeIndex) => {
        const judgeScore = result.judgeScores[judgeIndex];
        if (judgeScore) {
          row.push(
            judgeScore.score1.toString(),
            judgeScore.score2.toString(),
            judgeScore.score3.toString(),
            judgeScore.score4.toString(),
            judgeScore.weightedScore.toString()
          );
        } else {
          row.push("-", "-", "-", "-", "-");
        }
      });
      
      // Add average score
      row.push(result.averageScore ? result.averageScore.toFixed(1) : "-");
      
      csvContent += row.join(",") + "\r\n";
    });
    
    // Create and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `judging-results-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render medal for top submissions
  const renderRankMedal = (index: number) => {
    if (index === 0) {
      return <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md font-bold">
        <Medal className="h-4 w-4" /> 1st
      </div>;
    } else if (index === 1) {
      return <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-md font-bold">
        <Medal className="h-4 w-4" /> 2nd
      </div>;
    } else if (index === 2) {
      return <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-md font-bold">
        <Medal className="h-4 w-4" /> 3rd
      </div>;
    }
    return <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-800 rounded-md">
      {index + 1}th
    </div>;
  };
  
  // Render color-coded score cell
  const renderScoreCell = (score: number, isTotal: boolean = false) => {
    // Use neutral colors for all scores
    const bgColor = "bg-gray-50";
    const textColor = "text-gray-900";
    
    return (
      <div className={`px-2 py-1 rounded-md ${bgColor} ${textColor} font-semibold text-center`}>
        {score}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden mt-4">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            Detailed Judging Results
          </h2>
          <p className="text-sm text-gray-600">
            Comprehensive breakdown of scores from all judges
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* Remove the toggleFullBreakdown button */}
          <button
            onClick={toggleSortBy}
            className="flex items-center gap-1 px-3 py-2 bg-purple-50 border border-purple-200 rounded-md text-purple-700 hover:bg-purple-100 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Sort by {sortBy === "score" ? "Rank" : "Score"}</span>
          </button>
          
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 rounded-md text-white hover:bg-green-700 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      <div className="p-4 bg-blue-50 border-b border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-blue-800 font-medium">Judging Criteria Breakdown</p>
            <p className="text-blue-700 text-sm">
              Each submission is scored on four criteria with different weights: Design Content (40%),
              Color Application (30%), Technological Content (20%), and Innovative Solution (10%).
              The maximum possible score is 100 points.
            </p>
          </div>
        </div>
      </div>

      {/* Main results table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-0 whitespace-nowrap">
                Rank
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submission
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              
              {/* Render judge columns based on showFullBreakdown setting */}
              {judges.map(judge => (
                showFullBreakdown ? (
                  // If showing full breakdown, render each criterion
                  <React.Fragment key={judge.id}>
                    <th colSpan={5} scope="col" className="px-4 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 border-l border-r border-gray-200">
                      {judge.name}
                    </th>
                  </React.Fragment>
                ) : (
                  // Otherwise just show one column for total
                  <th key={judge.id} scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 border-x border-gray-200">
                    {judge.name}
                  </th>
                )
              ))}
              
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 border-l border-r border-gray-200">
                Average
              </th>
            </tr>
            
            {/* Sub-header row for criteria if showing full breakdown */}
            {showFullBreakdown && (
              <tr className="bg-gray-50 border-b border-gray-200">
                <th colSpan={3} className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  Criteria weights →
                </th>
                
                {judges.map(judge => (
                  <React.Fragment key={judge.id}>
                    <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-blue-600 border-l border-gray-200 bg-blue-50/50">
                      Design 40%
                    </th>
                    <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-blue-600 bg-blue-50/50">
                      Color 30%
                    </th>
                    <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-blue-600 bg-blue-50/50">
                      Tech 20%
                    </th>
                    <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-blue-600 bg-blue-50/50">
                      Innov 10%
                    </th>
                    <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-primary border-r border-gray-200 bg-blue-50/30">
                      Total
                    </th>
                  </React.Fragment>
                ))}
                
                <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-primary bg-yellow-50 border-l border-r border-gray-200">
                  Out of 100
                </th>
              </tr>
            )}
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedResults.map((result, index) => (
              <React.Fragment key={result.id}>
                <tr className={`hover:bg-gray-50 ${expandedSubmission === result.id ? 'bg-blue-50/30' : ''}`}>
                  {/* Rank column */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {renderRankMedal(index)}
                  </td>
                  
                  {/* Submission title */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 flex items-center">
                          {result.title}
                          <button 
                            onClick={() => toggleExpand(result.id)}
                            className="ml-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                          >
                            {expandedSubmission === result.id ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </button>
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {result.submissionNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Category */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {result.categoryName}
                    </span>
                  </td>
                  
                  {/* Judge scores */}
                  {judges.map((judge, judgeIndex) => {
                    const judgeScore = result.judgeScores[judgeIndex];
                    
                    if (showFullBreakdown) {
                      return (
                        <React.Fragment key={judge.id}>
                          {/* Design Content */}
                          <td className="px-2 py-4 text-center border-l border-gray-200 bg-gray-50/30">
                            {judgeScore ? renderScoreCell(judgeScore.score1) : <span className="text-gray-400">-</span>}
                          </td>
                          
                          {/* Color Application */}
                          <td className="px-2 py-4 text-center bg-gray-50/30">
                            {judgeScore ? renderScoreCell(judgeScore.score2) : <span className="text-gray-400">-</span>}
                          </td>
                          
                          {/* Technological Content */}
                          <td className="px-2 py-4 text-center bg-gray-50/30">
                            {judgeScore ? renderScoreCell(judgeScore.score3) : <span className="text-gray-400">-</span>}
                          </td>
                          
                          {/* Innovative Solution */}
                          <td className="px-2 py-4 text-center bg-gray-50/30">
                            {judgeScore ? renderScoreCell(judgeScore.score4) : <span className="text-gray-400">-</span>}
                          </td>
                          
                          {/* Total */}
                          <td className="px-2 py-4 text-center border-r border-gray-200 bg-primary/5">
                            {judgeScore ? renderScoreCell(judgeScore.weightedScore, true) : <span className="text-gray-400">-</span>}
                          </td>
                        </React.Fragment>
                      );
                    } else {
                      return (
                        <td key={judge.id} className="px-4 py-4 text-center whitespace-nowrap border-x border-gray-200 bg-gray-50/30">
                          {judgeScore ? renderScoreCell(judgeScore.weightedScore, true) : <span className="text-gray-400">-</span>}
                        </td>
                      );
                    }
                  })}
                  
                  {/* Average score */}
                  <td className="px-4 py-4 text-center whitespace-nowrap font-bold text-lg border-x border-gray-200 bg-yellow-50/50">
                    {result.averageScore ? (
                      <div className={`px-2 py-1 rounded-md ${
                        result.averageScore >= 90 ? 'bg-green-100 text-green-800' :
                        result.averageScore >= 80 ? 'bg-blue-100 text-blue-800' :
                        result.averageScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        result.averageScore >= 60 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {result.averageScore.toFixed(1)}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
                
                {/* Expanded row with detailed information */}
                {expandedSubmission === result.id && (
                  <tr className="bg-blue-50/20">
                    <td colSpan={showFullBreakdown ? (3 + judges.length * 5 + 1) : (3 + judges.length + 1)} className="px-6 py-4 border-b border-gray-200">
                      <div className="max-w-4xl mx-auto">
                        <h3 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
                          <Info className="h-4 w-4 mr-2 text-blue-500" />
                          Score Breakdown Details for "{result.title}"
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {result.judgeScores.map((judgeScore, idx) => {
                            if (!judgeScore) return null;
                            
                            // Calculate the weighted scores for each criterion
                            const weightedDesign = judgeScore.score1 * getCriterionMultiplier(1);
                            const weightedColor = judgeScore.score2 * getCriterionMultiplier(2);
                            const weightedTech = judgeScore.score3 * getCriterionMultiplier(3);
                            const weightedInnov = judgeScore.score4 * getCriterionMultiplier(4);
                            
                            return (
                              <div key={idx} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                                  <h4 className="font-medium text-gray-900">{judges[idx].name}</h4>
                                  <div className="px-2 py-1 bg-primary/10 rounded-md text-primary font-bold">
                                    {judgeScore.weightedScore}/100
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Design Content (40%):</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{judgeScore.score1}/10</span>
                                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">
                                        = {weightedDesign} pts
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Color Application (30%):</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{judgeScore.score2}/10</span>
                                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">
                                        = {weightedColor} pts
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Technological Content (20%):</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{judgeScore.score3}/10</span>
                                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">
                                        = {weightedTech} pts
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Innovative Solution (10%):</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{judgeScore.score4}/10</span>
                                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">
                                        = {weightedInnov} pts
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-800">Total Weighted Score:</span>
                                    <span className="px-3 py-1 bg-primary/10 rounded-md text-primary font-bold">
                                      {judgeScore.weightedScore}
                                    </span>
                                  </div>
                                </div>
                                
                                {judgeScore.comments && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <h5 className="text-sm font-medium text-gray-700 mb-1">Comments:</h5>
                                    <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded-md border border-gray-200">
                                      "{judgeScore.comments}"
                                    </p>
                                  </div>
                                )}
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
      
      {/* Table footer with summary information */}
      <div className="bg-white p-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {sortedResults.length} finalists evaluated by {judges.length} judges
            </span>
          </div>
          
          {/* <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            <div className="px-2 py-1 bg-green-100 text-green-800 rounded-md flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-800"></span>
              90-100: Excellent
            </div>
            <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-800"></span>
              80-89: Great
            </div>
            <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-800"></span>
              70-79: Good
            </div>
            <div className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-800"></span>
              60-69: Average
            </div>
            <div className="px-2 py-1 bg-red-50 text-red-600 rounded-md flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              60: Below Average
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}