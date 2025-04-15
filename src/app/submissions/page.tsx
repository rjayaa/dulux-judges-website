// app/submissions/page.tsx
import { Suspense } from 'react';
import SubmissionsContent from './submissionsContent';

export default function SubmissionsPage() {
  return (
    <Suspense fallback={<div>Loading submissions...</div>}>
      <SubmissionsContent />
    </Suspense>
  );
}