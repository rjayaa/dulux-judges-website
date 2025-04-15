// Types for the submission system
export type SubmissionFile = string;

export interface Submission {
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

export interface Category {
  id: string;
  name: string;
}