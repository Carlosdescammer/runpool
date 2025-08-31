'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { GroupForm } from '@/components/GroupForm';

export default function NewGroupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = () => {
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Create New Running Group</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Set up your running challenge group and invite others to join.
          </p>
        </div>

        <Card className="p-6">
          <GroupForm onSuccess={handleSuccess} />
        </Card>
      </div>
    </div>
  );
}
