'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GroupForm } from '@/components/GroupForm';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function EditGroupPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [groupData, setGroupData] = useState<{ 
    id: string; 
    name: string; 
    description: string; 
    rule: string; 
    entry_fee: number;
    default_entry_fee: number;
    default_distance_goal: number;
    default_duration_days: number;
    start_date: Date;
    timezone: string;
    is_public: boolean;
    allow_public_join: boolean;
    require_approval: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: group, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', id)
          .single();

        if (groupError) throw groupError;
        if (!group) {
          throw new Error('Group not found');
        }

        // Check if current user is the owner of the group
        if (String(group.owner_id) !== String(user.id)) {
          throw new Error('You do not have permission to edit this group');
        }

        setGroupData({
          id: group.id,
          name: group.name,
          description: group.description || '',
          rule: group.rule,
          entry_fee: group.entry_fee,
          default_entry_fee: (group.entry_fee || 1000) / 100, // Convert from cents to dollars (use entry_fee field)
          default_distance_goal: group.rule ? parseFloat(group.rule.match(/\d+\.?\d*/)?.[0] || '5') : 5, // Extract distance from rule
          default_duration_days: 7, // Default to weekly
          start_date: group.start_date || new Date(),
          timezone: group.timezone || 'America/New_York',
          is_public: group.is_public || true,
          allow_public_join: group.allow_public_join || true,
          require_approval: group.require_approval || false
        });
      } catch (err) {
        console.error('Error fetching group:', err);
        setError(err instanceof Error ? err.message : 'Failed to load group');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchGroup();
    }
  }, [id, router]);

  const handleSuccess = () => {
    router.push(`/group/${id}`);
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="wrap">
        <div>
          <div style={{height: '32px', backgroundColor: 'var(--muted)', borderRadius: '8px', marginBottom: '16px'}}></div>
          <div style={{height: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px', marginBottom: '16px'}}></div>
          <div style={{height: '128px', backgroundColor: 'var(--muted)', borderRadius: '8px'}}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrap">
        <div className="card">
          <div className="inner">
            <h2 style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#ef4444'}}>Error</h2>
            <p style={{marginBottom: '16px'}}>{error}</p>
            <button 
              className="btn" 
              onClick={() => router.back()}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div style={{marginBottom: '24px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <button 
            className="iconbtn" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 style={{fontSize: '24px', fontWeight: '800', marginBottom: '8px'}}>Edit Group</h1>
            <p style={{color: 'var(--muted)'}}>
              Update your running challenge group settings.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="inner">
          {groupData ? (
            <GroupForm 
              groupId={groupData.id} 
              onSuccess={handleSuccess} 
              defaultValues={{
                name: groupData.name,
                description: groupData.description || '',
                is_public: groupData.is_public,
                default_distance_goal: groupData.default_distance_goal,
                default_duration_days: groupData.default_duration_days,
                start_date: new Date(groupData.start_date),
                timezone: groupData.timezone,
                allow_public_join: groupData.allow_public_join,
                require_approval: groupData.require_approval,
              }}
            />
          ) : (
            <p>Loading group data...</p>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
