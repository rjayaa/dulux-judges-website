import { useState } from 'react';
import { AlertCircle, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { Submission } from '../types';

interface EvaluationFormProps {
  submission: Submission;
  evaluationMethod: string;
  evaluationCount: number;
  maxEvaluations: number;
  onSubmit: (data: any) => Promise<void>;
  onPrevious: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function EvaluationForm({
  submission,
  evaluationMethod,
  evaluationCount,
  maxEvaluations,
  onSubmit,
  onPrevious,
  onNext,
  isFirst,
  isLast
}: EvaluationFormProps) {
  const [isSelected, setIsSelected] = useState(submission.evaluated ?? false);
  const [comment, setComment] = useState(submission.comment ?? '');
  const [scores, setScores] = useState(submission.scores ?? {
    score1: '',
    score2: '',
    score3: '',
    score4: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ... rest of the evaluation form logic ...
  
  return (
    <div className="p-4 bg-white shadow-sm rounded-lg border border-gray-200">
      {/* Form content */}
    </div>
  );
}