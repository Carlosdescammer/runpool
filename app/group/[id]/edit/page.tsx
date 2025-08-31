'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { GroupForm } from '@/components/GroupForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function EditGroupPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [groupData, setGroupData] = useState<any>(null);
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

        // Check if current user is the coach/owner of the group
        if (group.coach_id !== user.id) {
          throw new Error('You do not have permission to edit this group');
        }

        setGroupData({
          ...group,
          default_entry_fee: group.default_entry_fee / 100 // Convert from cents to dollars
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mt-6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-md">
          <h2 className="text-lg font-medium">Error</h2>
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Group</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Update your running challenge group settings.
            </p>
          </div>
        </div>

        <Card className="p-6">
          {groupData ? (
            <GroupForm 
              groupId={groupData.id} 
              onSuccess={handleSuccess} 
              defaultValues={{
                name: groupData.name,
                description: groupData.description || '',
                is_public: groupData.is_public,
                default_entry_fee: groupData.default_entry_fee,
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
        </Card>
      </div>
    </div>
  );
}
