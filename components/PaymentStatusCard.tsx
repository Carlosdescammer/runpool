'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Participant {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  created_at: string;
}

interface PaymentStatusCardProps {
  weekId: string;
  groupId: string;
}

export function PaymentStatusCard({ weekId, groupId }: PaymentStatusCardProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderStatus, setReminderStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadPaymentStatus();
  }, [weekId]);

  const loadPaymentStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select(`
          id,
          user_id,
          payment_status,
          created_at,
          profiles:user_id (full_name, email)
        `)
        .eq('week_id', weekId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedParticipants = (data || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.profiles?.full_name || null,
        email: p.profiles?.email || 'Unknown',
        payment_status: p.payment_status,
        created_at: p.created_at,
      }));

      setParticipants(formattedParticipants);
    } catch (error) {
      console.error('Error loading payment status:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const sendPaymentReminders = async () => {
    setSendingReminders(true);
    setReminderStatus(null);

    try {
      const unpaidParticipants = participants.filter(p => p.payment_status === 'pending');
      
      if (unpaidParticipants.length === 0) {
        setReminderStatus({
          success: false,
          message: 'No unpaid participants to remind.'
        });
        return;
      }

      const emailPromises = unpaidParticipants.map(participant => 
        fetch('/api/notify/payment-reminder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: participant.email,
            name: participant.full_name || 'Runner',
            weekId,
            groupId
          })
        })
      );

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - successful;

      setReminderStatus({
        success: failed === 0,
        message: failed === 0 
          ? `Payment reminders sent to ${successful} participants!`
          : `Sent ${successful} reminders, ${failed} failed. Check console for details.`
      });

    } catch (error) {
      console.error('Error sending payment reminders:', error);
      setReminderStatus({
        success: false,
        message: 'Failed to send payment reminders. Please try again.'
      });
    } finally {
      setSendingReminders(false);
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span style={{padding: '2px 6px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '12px', fontSize: '11px'}}>✅ Paid</span>;
      case 'pending':
        return <span style={{padding: '2px 6px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '12px', fontSize: '11px'}}>⏳ Pending</span>;
      case 'failed':
        return <span style={{padding: '2px 6px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '12px', fontSize: '11px'}}>❌ Failed</span>;
      case 'refunded':
        return <span style={{padding: '2px 6px', backgroundColor: '#e2e3e5', color: '#383d41', borderRadius: '12px', fontSize: '11px'}}>💰 Refunded</span>;
      default:
        return <span style={{padding: '2px 6px', backgroundColor: '#f8f9fa', color: '#6c757d', borderRadius: '12px', fontSize: '11px'}}>❓ Unknown</span>;
    }
  };

  const paidCount = participants.filter(p => p.payment_status === 'paid').length;
  const unpaidCount = participants.filter(p => p.payment_status === 'pending').length;
  const failedCount = participants.filter(p => p.payment_status === 'failed').length;

  if (loading) {
    return (
      <div style={{padding: '16px', textAlign: 'center'}}>
        <div style={{marginBottom: '8px', fontWeight: '600'}}>Loading Payment Status...</div>
      </div>
    );
  }

  // Show message if no week ID is provided
  if (!weekId) {
    return (
      <div style={{padding: '16px'}}>
        <h4 style={{fontWeight: '600', marginBottom: '4px'}}>Payment Status</h4>
        <p className="muted">No active week found. Create a week to track payments.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="inline" style={{marginBottom: '16px'}}>
        <div>
          <h4 style={{fontWeight: '600'}}>Payment Status</h4>
          <p className="muted">Track payments and send reminders to unpaid participants</p>
        </div>
        <div style={{display: 'flex', gap: '8px', fontSize: '12px'}}>
          <span style={{padding: '2px 6px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '12px'}}>{paidCount} Paid</span>
          <span style={{padding: '2px 6px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '12px'}}>{unpaidCount} Pending</span>
          {failedCount > 0 && <span style={{padding: '2px 6px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '12px'}}>{failedCount} Failed</span>}
        </div>
      </div>

      {reminderStatus && (
        <div style={{
          padding: '12px', 
          borderRadius: '8px', 
          backgroundColor: reminderStatus.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${reminderStatus.success ? '#c3e6cb' : '#f5c6cb'}`,
          color: reminderStatus.success ? '#155724' : '#721c24',
          marginBottom: '16px'
        }}>
          {reminderStatus.message}
        </div>
      )}

      <div className="inline" style={{marginBottom: '16px'}}>
        <div className="muted">{participants.length} total participants</div>
        <button 
          onClick={sendPaymentReminders} 
          disabled={sendingReminders || unpaidCount === 0}
          className="btn ghost"
          style={{fontSize: '12px', padding: '4px 8px'}}
        >
          {sendingReminders ? (
            <>Sending...</>
          ) : (
            <>📧 Send Reminders ({unpaidCount})</>
          )}
        </button>
      </div>

      <div style={{border: '1px solid #e9ecef', borderRadius: '8px', overflow: 'hidden'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead style={{backgroundColor: '#f8f9fa'}}>
            <tr>
              <th style={{padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600'}}>Participant</th>
              <th style={{padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600'}}>Email</th>
              <th style={{padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600'}}>Status</th>
              <th style={{padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600'}}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 ? (
              <tr>
                <td colSpan={4} style={{padding: '32px', textAlign: 'center'}} className="muted">
                  No participants yet
                </td>
              </tr>
            ) : (
              participants.map((participant) => (
                <tr key={participant.id} style={{borderBottom: '1px solid #f8f9fa'}}>
                  <td style={{padding: '12px', fontWeight: '500'}}>
                    {participant.full_name || 'Anonymous'}
                  </td>
                  <td style={{padding: '12px'}} className="muted">
                    {participant.email}
                  </td>
                  <td style={{padding: '12px'}}>
                    {getPaymentBadge(participant.payment_status)}
                  </td>
                  <td style={{padding: '12px'}} className="muted">
                    {new Date(participant.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}