import { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Download, Clock } from 'lucide-react';
import { Submission } from '../types';

interface FilePreviewProps {
  submission: Submission;
  onShowDetails: () => void;
  showDetails: boolean;
}

export function FilePreview({ submission, onShowDetails, showDetails }: FilePreviewProps) {
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // ... file preview logic ...

  return (
    <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Preview content */}
    </div>
  );
}