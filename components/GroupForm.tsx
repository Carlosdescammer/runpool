'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// Define the form schema with proper types and defaults
const groupFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  is_public: z.boolean().default(true),
  default_entry_fee: z.number().min(0, 'Entry fee cannot be negative'),
  default_distance_goal: z.number().min(1, 'Distance goal must be at least 1 km'),
  default_duration_days: z.number().min(1, 'Duration must be at least 1 day'),
  start_date: z.date(),
  timezone: z.string(),
  allow_public_join: z.boolean().default(true),
  require_approval: z.boolean().default(false),
});

// Type for the form values
type GroupFormValues = z.infer<typeof groupFormSchema>;


interface GroupFormProps {
  groupId?: string;
  onSuccess?: () => void;
  defaultValues?: Partial<GroupFormValues>;
}

export function GroupForm({ groupId, onSuccess, defaultValues }: GroupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: '',
      description: '',
      is_public: true,
      default_entry_fee: 25, // $25 default
      default_distance_goal: 25, // 25 km default
      default_duration_days: 7, // 1 week default
      start_date: new Date(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      allow_public_join: true,
      require_approval: false,
      ...defaultValues,
    } as GroupFormValues,
  });

  const handleSubmit = async (data: GroupFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      const groupData = {
        ...data,
        default_entry_fee: Math.round(data.default_entry_fee * 100), // Convert to cents
      };

      if (groupId) {
        // Update existing group
        const { error } = await supabase
          .from('groups')
          .update(groupData)
          .eq('id', groupId);

        if (error) throw error;
      } else {
        // Create new group
        const { error } = await supabase
          .from('groups')
          .insert([{ ...groupData, coach_id: (await supabase.auth.getUser()).data.user?.id }]);

        if (error) throw error;
      }

      onSuccess?.();
    } catch (err) {
      console.error('Error saving group:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the group');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadGroup = async () => {
      if (!groupId) return;

      
      try {
        setIsLoading(true);
        const { data: group, error } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single();
          
        if (error) throw error;
        
        // Map database fields to form fields
        form.reset({
          name: group.name,
          description: group.description || '',
          is_public: group.is_public,
          default_entry_fee: group.default_entry_fee / 100, // Convert from cents to dollars
          default_distance_goal: group.default_distance_goal,
          default_duration_days: group.default_duration_days,
          start_date: new Date(group.start_date),
          timezone: group.timezone,
          allow_public_join: group.allow_public_join,
          require_approval: group.require_approval,
        });
      } catch (err) {
        console.error('Error loading group:', err);
        setError('Failed to load group data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGroup();
  }, [groupId, form]);

  const onSubmit = async (data: GroupFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Convert dollars to cents for storage
      const entryFeeCents = Math.round(data.default_entry_fee * 100);
      
      const groupData = {
        name: data.name,
        description: data.description,
        is_public: data.is_public,
        default_entry_fee: entryFeeCents,
        default_distance_goal: data.default_distance_goal,
        default_duration_days: data.default_duration_days,
        start_date: data.start_date.toISOString(),
        timezone: data.timezone,
        allow_public_join: data.allow_public_join,
        require_approval: data.require_approval,
        updated_at: new Date().toISOString(),
      };
      
      if (groupId) {
        // Update existing group
        const { error } = await supabase
          .from('groups')
          .update(groupData)
          .eq('id', groupId);
          
        if (error) throw error;
      } else {
        // Create new group
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const { error } = await supabase
          .from('groups')
          .insert([{
            ...groupData,
            coach_id: user.id,
            created_at: new Date().toISOString(),
          }]);
          
        if (error) throw error;
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      console.error('Error saving group:', err);
      setError('Failed to save group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Weekly Runners Club" {...field} disabled={isLoading} />
                </FormControl>
                <FormDescription>
                  A catchy name for your running group.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell potential members about your group..."
                    className="resize-none"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="default_entry_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Entry Fee ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="25.00"
                      {...field}
                      disabled={isLoading}
                      onChange={(e) => {
                        // Ensure we're only allowing numbers and one decimal point
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        const parts = value.split('.');
                        if (parts.length > 2) return; // Only allow one decimal point
                        if (parts[1] && parts[1].length > 2) return; // Only allow 2 decimal places
                        field.onChange(value === '' ? '' : parseFloat(value));
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Default amount members pay to join a challenge.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="default_distance_goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Distance Goal (km)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      step="0.1"
                      placeholder="25"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Default weekly running goal in kilometers.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="default_duration_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenge Duration (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="7"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    How many days each challenge will run.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When the first challenge will begin.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Zone</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Public Group</FormLabel>
                    <FormDescription>
                      Public groups are visible to everyone and can be discovered in search results.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="allow_public_join"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading || !form.watch('is_public')}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Allow Public Join</FormLabel>
                    <FormDescription>
                      Allow anyone to join this group without approval.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="require_approval"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading || form.watch('allow_public_join')}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Require Approval to Join</FormLabel>
                    <FormDescription>
                      Manually approve each member before they can join.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {groupId ? 'Update Group' : 'Create Group'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
