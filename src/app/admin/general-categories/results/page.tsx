"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Calculator,
  Printer
} from "lucide-react";
import EnhancedJudgingResults from "@/components/EnhancedJudgingResults";

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
  generalSelectionId: string;
  rank: number;
  title: string;
  submissionNumber: string;
  categoryName: string;
  judgeScores: (JudgeScore | null)[];
  averageScore: number | null;
}

interface Category {
  id: string;
  name: string;
}

export default function GeneralCategoriesResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [results, setResults] = useState<FinalistResult[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(searchParams.get("categoryId") || "all");
  const [showLegend, setShowLegend] = useState<boolean>(true);

  // Fetch results data
  useEffect(() => {
    fetchResults();
  }, [selectedCategoryId]);

  const fetchResults = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      const response = await fetch(`/api/admin/general-categories/results?categoryId=${selectedCategoryId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000)
      });
      
      if (response.status === 401) {
        router.push('/login?redirectTo=/admin/general-categories/results');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch jury results');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setJudges(data.judges);
        setResults(data.results);
        setCategories(data.categories);
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

  // Handle printing the results
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    if (printWindow && printRef.current) {
      // Create a new document in the new window
      printWindow.document.write(`
        <html>
          <head>
            <title>General Categories Judging Results</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @media print {
                body { font-size: 12pt; }
                table { page-break-inside: avoid; }
                tr { page-break-inside: avoid; }
                h2 { font-size: 18pt; font-weight: bold; margin-bottom: 10px; }
                h3 { font-size: 14pt; font-weight: bold; margin-bottom: 8px; }
                .print-header { text-align: center; margin-bottom: 20px; }
              }
            </style>
          </head>
          <body class="p-4">
            <div class="print-header">
              <h1 class="text-2xl font-bold mb-2">General Categories Competition Results</h1>
              <p class="text-gray-600">Generated on ${new Date().toLocaleDateString()}</p>
              ${selectedCategoryId !== "all" ? `<p class="text-gray-600">Category: ${categories.find(c => c.id === selectedCategoryId)?.name || "Unknown"}</p>` : ""}
            </div>
            ${printRef.current.innerHTML}
          </body>
        </html>
      `);
      
      // Wait for content to load then print
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        // printWindow.close();
      }, 1000);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex-1 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <h2 className="text-xl font-semibold mb-2 text-black">Loading Jury Results</h2>
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
              <div className="bg-purple-100 p-2 rounded-full">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">General Categories Final Results</h1>
                <p className="text-gray-600 text-sm">
                  Transparent scoring breakdown from all judges across all criteria
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/general-categories"
                className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Scoring</span>
              </Link>
              
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>Print Results</span>
              </button>
              
              <button
                onClick={() => fetchResults()}
                className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh Data</span>
              </button>
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
          </div>
        </div>
        
        {/* Info card for judges */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">Judging Panel</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {judges.map((judge, index) => (
                  <div key={judge.id} className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
                    Judge {index + 1}: {judge.name}
                  </div>
                ))}
              </div>
              {judges.length === 0 && (
                <p className="text-gray-500 text-sm">No judges have provided scores yet.</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Main results component */}
        <div ref={printRef}>
          {results.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Available</h3>
              <p className="text-gray-600 mb-4">
                There are no jury evaluations recorded for any selected submissions yet.
                {selectedCategoryId === "all" ? " Try selecting a specific category." : " Make sure submissions are selected and scored."}
              </p>
              <div className="flex gap-2 justify-center">
                <Link 
                  href="/admin/general-categories/selections"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md inline-block font-medium"
                >
                  Manage Selections
                </Link>
                <Link 
                  href="/admin/general-categories"
                  className="px-4 py-2 bg-primary text-white rounded-md inline-block font-medium"
                >
                  Go to Jury Scoring
                </Link>
              </div>
            </div>
          ) : (
            <EnhancedJudgingResults 
              results={results}
              judges={judges}
            />
          )}
          
          {/* Legend for printed version */}
          {showLegend && results.length > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  Scoring Legend & Methodology
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Criteria Weighting</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between p-2 bg-blue-50 rounded-md">
                      <span className="text-sm font-medium text-black">Design Content:</span>
                      <span className="text-sm bg-blue-100 px-2 py-0.5 rounded text-blue-800">40% weight</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-800 px-2 font-medium">
                      Penilaian secara kualitatif pada aspek lokalitas maupun modern pada elemen desain. Penilaian secara kuantitatif pada konten, bangunan hijau, kesehatan, efektifitas dan efisien, kepraktisan dan menimbulkan rasa kebahagiaan.
                    </div>
                    
                    <div className="flex justify-between p-2 bg-blue-50 rounded-md">
                      <span className="text-sm font-medium text-black">Color Application:</span>
                      <span className="text-sm bg-blue-100 px-2 py-0.5 rounded text-blue-800">30% weight</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-800 px-2 font-medium">
                      Fokus utama pada penggunaan True Joys sebagai warna dominan dan bagaimana kombinasi dengan palet lainnya menciptakan atmosfer yang harmonis dan menginspirasi.
                    </div>
                    
                    <div className="flex justify-between p-2 bg-blue-50 rounded-md">
                      <span className="text-sm font-medium text-black">Technological Content:</span>
                      <span className="text-sm bg-blue-100 px-2 py-0.5 rounded text-blue-800">20% weight</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-800 px-2 font-medium">
                      Teknik, kompetensi, alat konstruksi, material, dan metode konstruksi.
                    </div>
                    
                    <div className="flex justify-between p-2 bg-blue-50 rounded-md">
                      <span className="text-sm font-medium text-black">Innovative Solution:</span>
                      <span className="text-sm bg-blue-100 px-2 py-0.5 rounded text-blue-800">10% weight</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-800 px-2 font-medium">
                      Kombinasi dari Konten Kualitatif, Kuantitatif, Teknologi, dan Aplikasi warna dalam kreasi dan solusi unik.
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-gray-50 p-3 rounded-md border border-gray-200">
                    <p className="text-xs text-gray-600">
                      Each criterion is scored on a scale of 1-10, then multiplied by its weight factor.
                      This gives a maximum possible score of 100 points per judge.
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">General Categories Info</h4>
                  <div className="space-y-2">
                    <div className="p-2 bg-purple-50 rounded-md">
                      <span className="text-sm font-medium text-purple-800">Flexible Quantity System</span>
                      <div className="mt-1 text-sm text-purple-700">
                        Unlike the city project category with fixed Top 5, general categories support dynamic quantities of submissions for evaluation.
                      </div>
                    </div>
                    
                    <div className="p-2 bg-purple-50 rounded-md">
                      <span className="text-sm font-medium text-purple-800">Judge Panel</span>
                      <div className="mt-1 text-sm text-purple-700">
                        Typically uses 3 judges per category, but can be adjusted as needed for different competition requirements.
                      </div>
                    </div>
                    
                    <div className="p-2 bg-purple-50 rounded-md">
                      <span className="text-sm font-medium text-purple-800">Same Criteria</span>
                      <div className="mt-1 text-sm text-purple-700">
                        Uses identical scoring criteria and weights as the city project category to ensure consistency across all competition categories.
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-gray-50 p-3 rounded-md border border-gray-200">
                    <p className="text-xs text-gray-600">
                      The average score is calculated by taking the mean of all judges'
                      total scores for each submission. Rankings are determined by these average scores.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}