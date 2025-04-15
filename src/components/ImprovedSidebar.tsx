import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Filter, FileText, Check, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

// Improved sidebar component with pagination at the top
const ImprovedSidebar = ({ 
  submissions, 
  selectedSubmission, 
  onSelectSubmission, 
  isLoading, 
  filterCategory, 
  setFilterCategory 
}) => {
  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("compact"); // compact, detailed
  const ITEMS_PER_PAGE = 10;

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory]);

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      // Category filter
      const categoryMatch = filterCategory === "all" || sub.categoryId === filterCategory;
      
      // Search query filter
      const query = searchQuery.toLowerCase();
      const searchMatch = !searchQuery || 
        sub.title.toLowerCase().includes(query) ||
        sub.description.toLowerCase().includes(query) ||
        sub.submissionId.toLowerCase().includes(query) ||
        (sub.categoryName && sub.categoryName.toLowerCase().includes(query));
      
      return categoryMatch && searchMatch;
    });
  }, [submissions, filterCategory, searchQuery]);

  // Calculate pagination
  const totalItems = filteredSubmissions.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  
  // Get paginated items
  const paginatedItems = useMemo(() => {
    return filteredSubmissions.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredSubmissions, currentPage, ITEMS_PER_PAGE]);

  // Navigation functions
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

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilterCategory("all");
  };

  // Quick page navigation
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Search bar */}
      <div className="p-4 border-b border-gray-200">
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

      {/* View mode toggle and info */}
      <div className="px-4 pt-2 pb-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          {/* View Mode Toggle */}
          <div className="flex text-xs rounded-md overflow-hidden border border-gray-300 shadow-sm">
            <button 
              className={`px-2 py-1 ${viewMode === 'compact' ? 'bg-primary text-white' : 'bg-white text-gray-800'}`}
              onClick={() => setViewMode('compact')}
            >
              Compact
            </button>
            <button 
              className={`px-2 py-1 ${viewMode === 'detailed' ? 'bg-primary text-white' : 'bg-white text-gray-800'}`}
              onClick={() => setViewMode('detailed')}
            >
              Detailed
            </button>
          </div>
          
          <div className="text-xs text-gray-500">
            {totalItems} items found
          </div>
        </div>
        
        {/* Show clear filters button if filters are applied */}
        {(searchQuery || filterCategory !== "all") && (
          <div className="mt-2 flex justify-end">
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

      {/* Pagination - Now at the top, before the list */}
      {totalPages > 1 && (
        <div className="p-3 border-b border-gray-200 bg-primary/5">
          <div className="flex items-center justify-between">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1 
                  ? 'bg-gray-100 text-black cursor-not-allowed' 
                  : 'bg-white text-gray-800 hover:bg-primary/20 shadow-sm border border-gray-300'
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center">
              <span className="font-medium text-gray-700">Page</span>
              <div className="mx-2 px-3 py-1 bg-white border border-gray-300 text-black rounded-md shadow-sm text-center min-w-[40px]">
                {currentPage}
              </div>
              <span className="text-gray-600">of {totalPages}</span>
            </div>
            
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${
                currentPage === totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-800 hover:bg-primary/20 shadow-sm border border-gray-300'
              }`}
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          {/* Page jump buttons for easy navigation */}
          {totalPages > 3 && (
            <div className="flex justify-center mt-2 gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                // Calculate which page numbers to show
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = idx + 1;
                } else if (currentPage <= 3) {
                  pageNum = idx + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + idx;
                } else {
                  pageNum = currentPage - 2 + idx;
                }
                
                return (
                  <button
                    key={idx}
                    onClick={() => goToPage(pageNum)}
                    className={`w-7 h-7 text-xs rounded-md ${
                      currentPage === pageNum
                        ? 'bg-primary text-white font-bold'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* List of submissions */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : paginatedItems.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {paginatedItems.map(item => (
              viewMode === 'compact' ? (
                <li 
                  key={item.id}
                  className={`px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors flex items-center ${
                    selectedSubmission?.id === item.id
                      ? "bg-primary/10 text-primary border-l-4 border-primary pl-2"
                      : item.evaluated
                        ? "border-l-4 border-green-500 pl-2"
                        : ""
                  }`}
                  onClick={() => onSelectSubmission(item)}
                >
                  <div className="mr-3 flex-shrink-0">
                    <FileText className={`h-5 w-5 ${
                      selectedSubmission?.id === item.id
                        ? "text-primary"
                        : item.evaluated
                          ? "text-green-500"
                          : "text-gray-500"
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span>{item.categoryName}</span>
                      <span>•</span>
                      <span className="truncate">ID: {item.submissionId}</span>
                    </div>
                  </div>
                  
                  {item.evaluated && (
                    <span className="ml-2 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </li>
              ) : (
                <li 
                  key={item.id}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedSubmission?.id === item.id
                      ? "bg-primary/10 text-primary border-l-4 border-primary pl-2"
                      : item.evaluated
                        ? "border-l-4 border-green-500 pl-2"
                        : ""
                  }`}
                  onClick={() => onSelectSubmission(item)}
                >
                  <div className="flex items-start mb-2">
                    <div className="mr-3 flex-shrink-0 mt-1">
                      <FileText className={`h-5 w-5 ${
                        selectedSubmission?.id === item.id
                          ? "text-primary"
                          : item.evaluated
                            ? "text-green-500"
                            : "text-gray-500"
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">
                        {item.title}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {item.categoryName}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(item.submittedAt).toLocaleDateString()}
                        </span>
                        {item.evaluated && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs flex items-center">
                            <Check className="w-3 h-3 mr-1" />
                            Evaluated
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pl-8 text-xs text-gray-600 truncate">
                    {item.description.substring(0, 120)}
                    {item.description.length > 120 ? '...' : ''}
                  </div>
                  
                  <div className="pl-8 mt-1 text-xs text-gray-500">
                    ID: <span className="font-mono">{item.submissionId}</span>
                  </div>
                </li>
              )
            ))}
          </ul>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Filter className="mx-auto h-8 w-8 mb-2" />
            <p>No submissions found</p>
            <button
              onClick={clearFilters}
              className="mt-2 text-primary text-sm font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImprovedSidebar;