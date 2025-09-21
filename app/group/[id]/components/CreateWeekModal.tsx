'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface CreateWeekModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  onWeekCreated: () => void;
}

export function CreateWeekModal({ groupId, isOpen, onClose, onWeekCreated }: CreateWeekModalProps) {
  const [distanceGoal, setDistanceGoal] = useState<number>(5.0);
  const [weekStart, setWeekStart] = useState<string>(new Date().toISOString().slice(0, 10));
  const [weekEnd, setWeekEnd] = useState<string>(new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10));
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreateWeek = async () => {
    if (!weekStart || !weekEnd || distanceGoal <= 0) {
      toast.error('Please fill in all fields with valid values');
      return;
    }

    if (new Date(weekEnd) <= new Date(weekStart)) {
      toast.error('End date must be after start date');
      return;
    }

    setIsCreating(true);

    try {
      console.log('Creating week with params:', { groupId, weekStart, weekEnd, distanceGoal });

      // Get the latest week number for this group and increment
      const { data: existingWeeks, error: weekError } = await supabase
        .from('weeks')
        .select('week_number')
        .eq('group_id', groupId)
        .order('week_number', { ascending: false })
        .limit(1);

      if (weekError) {
        console.error('Error fetching existing weeks:', weekError);
        throw new Error(`Failed to fetch existing weeks: ${weekError.message}`);
      }

      let weekNumber = 1;
      if (existingWeeks && existingWeeks.length > 0) {
        weekNumber = existingWeeks[0].week_number + 1;
      }
      console.log('Using week number:', weekNumber);

      // Get group entry fee
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('Error fetching group:', groupError);
        throw new Error(`Failed to get group information: ${groupError.message}`);
      }

      console.log('Group data:', group);

      // Create the new week
      const weekData = {
        group_id: groupId,
        week_number: weekNumber,
        start_date: weekStart,
        end_date: weekEnd,
        distance_goal_km: distanceGoal * 1.60934, // Convert miles to km for storage
        entry_fee_cents: 0, // No entry fee
        status: 'upcoming'
      };

      console.log('Creating week with data:', weekData);

      const { error, data: weekResult } = await supabase.from('weeks').insert(weekData).select();

      if (error) {
        console.error('Error inserting week:', error);
        throw new Error(`Failed to create week: ${error.message}`);
      }

      console.log('Week created successfully:', weekResult);

      toast.success(`Week ${weekNumber} created successfully!`);
      onWeekCreated();
      onClose();

      // Reset form
      setDistanceGoal(5.0);
      setWeekStart(new Date().toISOString().slice(0, 10));
      setWeekEnd(new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10));

    } catch (error) {
      console.error('Error creating week:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create week');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: 'min(500px, calc(100vw - 32px))',
          width: '90%',
          margin: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inner">
          <div className="inline" style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
              Create New Week
            </h3>
            <button
              onClick={onClose}
              className="btn ghost"
              style={{ fontSize: '14px', padding: '4px 8px' }}
            >
              ✕ Close
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="distance-goal">Distance Goal (miles)</label>
            <input
              id="distance-goal"
              className="field"
              type="number"
              step="0.1"
              min="0.1"
              value={distanceGoal}
              onChange={(e) => setDistanceGoal(Number(e.target.value))}
              placeholder="5.0"
            />
            <div className="muted" style={{ marginTop: '4px', fontSize: '12px' }}>
              Total miles participants need to complete this week
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: '24px' }}>
            <div>
              <label htmlFor="week-start">Week Start</label>
              <input
                id="week-start"
                className="field"
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="week-end">Week End</label>
              <input
                id="week-end"
                className="field"
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="divider"></div>

          <div className="row">
            <button
              onClick={onClose}
              className="btn ghost"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateWeek}
              className="btn primary"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Week'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}