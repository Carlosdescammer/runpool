'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { GroupForm } from '@/components/GroupForm';
import Header from '@/components/Header';

export default function NewGroupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = (groupId?: string) => {
    if (groupId) {
      // Redirect to the newly created group
      router.push(`/group/${groupId}`);
    } else {
      // Fallback to onboarding if no group ID
      router.push('/onboarding');
    }
  };

  return (
    <>
      <Header />
      <div className="wrap">
        <div style={{maxWidth: '800px', margin: '0 auto'}}>
          <div style={{marginBottom: '32px'}}>
            <h1 style={{fontSize: '32px', fontWeight: '800', marginBottom: '8px'}}>
              Create New Running Pool
            </h1>
            <p style={{color: 'var(--muted)', fontSize: '18px', lineHeight: '1.6'}}>
              Set up your running challenge group and invite others to join.
            </p>
          </div>

          <div className="card">
            <div className="inner">
              <GroupForm onSuccess={handleSuccess} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
