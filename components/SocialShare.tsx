'use client';

import { useState } from 'react';
import { Share2, Twitter, Facebook, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface LeaderboardEntry {
  user_id: string;
  name: string | null;
  miles: number;
  rank: number;
}

interface SocialShareProps {
  userRank: number;
  userName: string;
  miles: number;
  groupName: string;
  totalRunners: number;
  groupUrl?: string;
  leaderboard?: LeaderboardEntry[];
}

export function SocialShare({ 
  userRank, 
  userName, 
  miles, 
  groupName, 
  totalRunners,
  groupUrl = window.location.href,
  leaderboard = []
}: SocialShareProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
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
    setShowLeaderboard(true);
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(groupUrl)}&quote=${encodeURIComponent(generateShareText())}`;
    window.open(url, '_blank', 'width=550,height=420');
    setShowShareMenu(false);
    setShowLeaderboard(true);
  };

  const copyToClipboard = async () => {
    try {
      const shareText = `${generateShareText()}\n\nJoin the challenge: ${groupUrl}`;
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
      setShowShareMenu(false);
      setShowLeaderboard(true);
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
        setShowLeaderboard(true);
      } catch (error) {
        // User cancelled or error occurred, fall back to custom share menu
        setShowShareMenu(true);
      }
    } else {
      setShowShareMenu(true);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowShareMenu(true)}
        className="text-blue-600 hover:text-blue-800 w-full sm:w-auto text-xs sm:text-sm"
      >
        <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
        Share
      </Button>

      {showShareMenu && (
        <Card className="absolute right-0 bottom-full mb-2 z-50 p-3 min-w-[200px] shadow-lg border">
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

      {/* Leaderboard Display */}
      {showLeaderboard && leaderboard.length > 0 && (
        <Card className="absolute right-0 bottom-full mb-2 z-50 p-4 min-w-[300px] max-w-[400px] shadow-lg border">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                🎉 Shared! Here's the current leaderboard:
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeaderboard(false)}
                className="text-xs text-gray-500 h-6 w-6 p-0"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {leaderboard.slice(0, 5).map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.rank === userRank;
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between py-2 px-2 rounded text-sm ${
                      isCurrentUser 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        rank === 1 
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                          : rank === 2
                          ? 'bg-gray-100 text-gray-800 border border-gray-300'
                          : rank === 3
                          ? 'bg-orange-100 text-orange-800 border border-orange-300'
                          : 'bg-gray-50 text-gray-600'
                      }`}>
                        {rank === 1 ? '🏆' : rank}
                      </div>
                      <span className={`font-medium ${isCurrentUser ? 'text-blue-800' : 'text-gray-800'}`}>
                        {entry.name || 'Anonymous'}
                        {isCurrentUser && ' (You)'}
                      </span>
                    </div>
                    <span className={`font-bold tabular-nums ${isCurrentUser ? 'text-blue-800' : 'text-gray-600'}`}>
                      {Number(entry.miles).toFixed(1)} mi
                    </span>
                  </div>
                );
              })}
              {leaderboard.length > 5 && (
                <div className="text-xs text-gray-500 text-center py-1">
                  +{leaderboard.length - 5} more runners
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Backdrop to close menu */}
      {(showShareMenu || showLeaderboard) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowShareMenu(false);
            setShowLeaderboard(false);
          }}
        />
      )}
    </div>
  );
}
