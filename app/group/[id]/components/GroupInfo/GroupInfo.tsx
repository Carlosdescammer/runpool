'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type GroupInfoProps = {
  group: {
    id: string;
    name: string;
    rule: string;
    entry_fee?: number;
  };
  isAdmin: boolean;
  joinLink: string;
  onEditGroup?: () => void;
};

export function GroupInfo({ group, isAdmin, joinLink, onEditGroup }: GroupInfoProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinLink);
    setCopied(true);
    toast.success('Invite link copied to clipboard!');
    
    // Reset the copied state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">{group.name}</h3>
        {isAdmin && onEditGroup && (
          <Button 
            variant="secondary" 
            size="sm"
            onClick={onEditGroup}
          >
            Edit
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Challenge Rule</h4>
          <p className="mt-1">{group.rule || 'No specific rules set'}</p>
        </div>
        
        {group.entry_fee && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Entry Fee</h4>
            <p className="mt-1">${group.entry_fee} per week</p>
          </div>
        )}
        
        <div>
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-500">Invite Link</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600 hover:text-blue-800"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="mt-1 p-2 card text-sm muted overflow-x-auto">
            <code className="text-xs">{joinLink}</code>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Share this link to invite others to join this group
          </p>
        </div>
        
        {isAdmin && (
          <div className="pt-2 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Tools</h4>
            <div className="space-y-2">
              <a href={`/group/${group.id}/admin`} className="block">
                <Button variant="secondary" size="sm" className="w-full">
                  Manage Members
                </Button>
              </a>
              <Button variant="secondary" size="sm" className="w-full" disabled>
                View Payment History
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
