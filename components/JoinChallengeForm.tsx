'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface JoinChallengeFormProps {
  weekId: string;
  onSuccess?: () => void;
}

export function JoinChallengeForm({ weekId, onSuccess }: JoinChallengeFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinComplete, setJoinComplete] = useState(false);

  const handleJoinChallenge = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be logged in to join a challenge');
      }

      const { error } = await supabase
        .from('participants')
        .insert({
          week_id: weekId,
          user_id: user.id,
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('You have already joined this challenge');
        }
        throw error;
      }

      setJoinComplete(true);
      if (onSuccess) {
        onSuccess();
      }

      // Refresh the page to update the UI
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error('Error joining challenge:', err);
      setError(err instanceof Error ? err.message : 'Failed to join challenge');
    } finally {
      setIsLoading(false);
    }
  };

  if (joinComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Successfully Joined!</CardTitle>
          <CardDescription>You&apos;ve successfully joined this week&apos;s challenge.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>You&apos;re all set!</AlertTitle>
            <AlertDescription>
              You&apos;ve joined the challenge successfully.
              You can now submit your run proof once you&apos;ve completed your run.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join This Week&apos;s Challenge</CardTitle>
        <CardDescription>
          Join the running challenge and compete with other participants!
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Ready to Join?</h4>
            <p className="text-sm text-muted-foreground">
              Click the button below to join this week&apos;s running challenge.
              Once you join, you&apos;ll be able to submit proof of your runs.
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end">
        <Button
          onClick={handleJoinChallenge}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            'Join Challenge'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}