'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-2xl font-bold text-gray-900">Something went wrong!</h2>
        <p className="text-gray-600">
          We&apos;re sorry, but something unexpected happened. Please try again.
        </p>
        <Button onClick={reset} className="mx-auto">
          Try again
        </Button>
      </div>
    </div>
  );
}