'use client';

import { useState } from 'react';
import { Share2, Twitter, Facebook, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface SocialShareProps {
  userRank: number;
  userName: string;
  miles: number;
  groupName: string;
  totalRunners: number;
  groupUrl?: string;
}

export function SocialShare({ 
  userRank, 
  userName, 
  miles, 
  groupName, 
  totalRunners,
  groupUrl = window.location.href 
}: SocialShareProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateShareText = () => {
    const rankSuffix = userRank === 1 ? 'st' : userRank === 2 ? 'nd' : userRank === 3 ? 'rd' : 'th';
    const emoji = userRank === 1 ? '🏆' : userRank <= 3 ? '🥉' : '🏃‍♂️';
    const formattedMiles = Number(miles).toFixed(1);
    
    return `${emoji} Just finished ${userRank}${rankSuffix} place in ${groupName} with ${formattedMiles} miles! ${userRank <= 3 ? 'Making moves!' : 'Keep grinding!'} #RunPool #Running`;
  };

  const shareToTwitter = () => {
    const text = generateShareText();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(groupUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
    setShowShareMenu(false);
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(groupUrl)}&quote=${encodeURIComponent(generateShareText())}`;
    window.open(url, '_blank', 'width=550,height=420');
    setShowShareMenu(false);
  };

  const copyToClipboard = async () => {
    try {
      const shareText = `${generateShareText()}\n\nJoin the challenge: ${groupUrl}`;
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
      setShowShareMenu(false);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userName}'s RunPool Achievement`,
          text: generateShareText(),
          url: groupUrl,
        });
        setShowShareMenu(false);
      } catch (error) {
        // User cancelled or error occurred, fall back to custom share menu
        setShowShareMenu(true);
      }
    } else {
      setShowShareMenu(true);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleNativeShare}
        className="flex items-center gap-1"
      >
        <Twitter className="h-4 w-4" />
        <Facebook className="h-4 w-4" />
        <Share2 className="h-4 w-4" />
      </Button>

      {showShareMenu && (
        <Card className="absolute right-0 top-full mt-2 z-50 p-3 min-w-[200px] shadow-lg border">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 mb-3">
              Share your progress
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={shareToTwitter}
              className="w-full justify-start gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Twitter className="h-4 w-4" />
              Share on Twitter
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={shareToFacebook}
              className="w-full justify-start gap-2 text-blue-800 hover:text-blue-900 hover:bg-blue-50"
            >
              <Facebook className="h-4 w-4" />
              Share on Facebook
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="w-full justify-start gap-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
          
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShareMenu(false)}
              className="w-full text-xs text-gray-500"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Backdrop to close menu */}
      {showShareMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  );
}
