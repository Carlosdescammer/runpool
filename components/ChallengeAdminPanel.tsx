'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

interface Participant {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  proof_url: string | null;
  proof_submitted_at: string | null;
  verification_status: 'pending' | 'approved' | 'rejected' | null;
  verification_notes: string | null;
  distance_km: number | null;
}

interface ChallengeAdminPanelProps {
  weekId: string;
  isAdmin: boolean;
  distanceGoal: number;
  endDate: string;
}

export function ChallengeAdminPanel({ weekId, isAdmin, distanceGoal, endDate }: ChallengeAdminPanelProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!weekId) return;
    
    const fetchParticipants = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('participants')
          .select(`
            id,
            user_id,
            proof_url,
            proof_submitted_at,
            verification_status,
            verification_notes,
            distance_km,
            profiles:user_id (id, full_name, email, avatar_url)
          `)
          .eq('week_id', weekId);

        if (error) throw error;

        // Transform the data to match our Participant interface
        const formattedParticipants = (data || []).map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          full_name: p.profiles?.full_name || null,
          email: p.profiles?.email || 'Unknown',
          avatar_url: p.profiles?.avatar_url || null,
          proof_url: p.proof_url,
          proof_submitted_at: p.proof_submitted_at,
          verification_status: p.verification_status,
          verification_notes: p.verification_notes,
          distance_km: p.distance_km,
        }));

        setParticipants(formattedParticipants);
      } catch (err) {
        console.error('Error fetching participants:', err);
        setError('Failed to load participants');
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('participants_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `week_id=eq.${weekId}`
        },
        (payload) => {
          // Handle real-time updates
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [weekId]);

  const handleVerify = async (participantId: string, status: 'approved' | 'rejected', notes?: string) => {
    if (!isAdmin) return;
    
    try {
      setError(null);
      
      const { error } = await supabase.rpc('verify_participant', {
        week_id_param: weekId,
        user_id_param: participantId,
        is_approved: status === 'approved',
        notes: notes || null
      });
      
      if (error) throw error;
      
      // Update local state
      setParticipants(prev => 
        prev.map(p => 
          p.user_id === participantId 
            ? { 
                ...p, 
                verification_status: status,
                verification_notes: notes || null
              } 
            : p
        )
      );
      
      setSuccess(`Proof ${status} successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error verifying participant:', err);
      setError('Failed to update verification status');
    }
  };

  const handleFinalizeWeek = async () => {
    if (!isAdmin) return;
    
    if (!confirm('Are you sure you want to finalize this week? This cannot be undone.')) {
      return;
    }
    
    try {
      setIsFinalizing(true);
      setError(null);
      
      const { data, error } = await supabase.rpc('finalize_week', {
        week_id_param: weekId
      });
      
      if (error) throw error;
      
      setSuccess('Week finalized successfully! Payouts are being processed.');
      router.refresh();
    } catch (err) {
      console.error('Error finalizing week:', err);
      setError('Failed to finalize week. Please try again.');
    } finally {
      setIsFinalizing(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };


  const hasPendingVerifications = participants.some(
    p => p.verification_status === 'pending' && p.proof_url
  );

  const canFinalize = new Date() > new Date(endDate) && hasPendingVerifications === false;

  if (!isAdmin) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Admin Access Required</AlertTitle>
        <AlertDescription>
          You must be a group admin to access this panel.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">Participant Submissions</h2>
          <p className="text-sm text-muted-foreground">
            Review and verify run proofs for this week&apos;s challenge.
          </p>
        </div>
        
        <Button 
          onClick={handleFinalizeWeek}
          disabled={!canFinalize || isFinalizing}
          variant={canFinalize ? 'default' : 'outline'}
          className="w-full sm:w-auto"
        >
          {isFinalizing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finalizing...
            </>
          ) : (
'Finalize Week'
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : participants.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No participants yet</AlertTitle>
          <AlertDescription>
            No one has joined this week&apos;s challenge yet.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {participant.avatar_url ? (
                        <Image 
                          src={participant.avatar_url} 
                          alt={participant.full_name || participant.email}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {participant.email.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {participant.full_name || participant.email.split('@')[0]}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {participant.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(participant.verification_status)}
                  </TableCell>
                  <TableCell>
                    {participant.distance_km !== null 
                      ? `${participant.distance_km} km` 
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {participant.proof_url ? (
                      <a 
                        href={participant.proof_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Proof
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">No proof</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleVerify(participant.user_id, 'approved')}
                        disabled={participant.verification_status === 'approved' || !participant.proof_url}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" /> 
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const notes = prompt('Reason for rejection (optional):');
                          if (notes !== null) {
                            handleVerify(participant.user_id, 'rejected', notes);
                          }
                        }}
                        disabled={participant.verification_status === 'rejected' || !participant.proof_url}
                        className="text-destructive border-destructive/50 hover:bg-destructive/10"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      
      {hasPendingVerifications && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Pending Verifications</AlertTitle>
          <AlertDescription>
            You have pending run proofs to verify. Please review all submissions before finalizing the week.
          </AlertDescription>
        </Alert>
      )}
      
      {new Date() < new Date(endDate) && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Challenge in Progress</AlertTitle>
          <AlertDescription>
            The challenge is still in progress until {format(new Date(endDate), 'MMMM d, yyyy')}. 
            You can review submissions, but you won&apos;t be able to finalize the week until after the end date.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
