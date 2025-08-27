'use client';

import { Card } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Crown } from 'lucide-react';

type LeaderboardRow = {
  user_id: string;
  name: string | null;
  miles: number;
  isCurrentUser?: boolean;
  isAdmin?: boolean;
  rank: number;
  rankChange?: number;
  streak?: number;
};

type LeaderboardProps = {
  leaderboard: LeaderboardRow[];
  currentUserId: string | null;
  groupOwnerId: string;
  isLoading?: boolean;
};

export function Leaderboard({ leaderboard, currentUserId, groupOwnerId, isLoading = false }: LeaderboardProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <h3 className="mb-4 text-lg font-semibold">Loading leaderboard...</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold">Leaderboard</h3>
        <p className="mt-2 text-gray-500">No entries yet. Be the first to log your miles!</p>
      </Card>
    );
  }

  const getRankBadge = (rank: number) => {
    const rankColors = {
      1: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      2: 'bg-gray-100 text-gray-800 border-gray-300',
      3: 'bg-amber-100 text-amber-800 border-amber-300',
      default: 'bg-blue-50 text-blue-800 border-blue-200',
    };

    const colorClass = rank <= 3 ? rankColors[rank as keyof typeof rankColors] : rankColors.default;
    
    return (
      <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full border ${colorClass}`}>
        {rank}
      </span>
    );
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Weekly Leaderboard</h3>
        <div className="text-sm text-gray-500">{leaderboard.length} participants</div>
      </div>
      
      <div className="space-y-3">
        {leaderboard.map((entry, index) => {
          const isCurrentUser = entry.user_id === currentUserId;
          const isAdmin = entry.user_id === groupOwnerId;
          
          return (
            <div 
              key={entry.user_id}
              className={`flex items-center justify-between p-3 card transition-colors ${
                isCurrentUser ? 'ring-2 ring-brand' : 'hover:opacity-80'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {getRankBadge(index + 1)}
                  {isAdmin && (
                    <Crown className="absolute -top-2 -right-2 w-4 h-4 text-yellow-500" />
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    {entry.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className={`font-medium ${isCurrentUser ? 'text-blue-700' : ''}`}>
                    {entry.name || 'Anonymous'}
                    {isCurrentUser && ' (You)'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {entry.streak && entry.streak > 1 && (
                  <div className="hidden sm:flex items-center text-sm text-gray-500">
                    <span className="font-medium text-amber-600">🔥</span>
                    <span className="ml-1">{entry.streak} weeks</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  {entry.rankChange !== undefined && entry.rankChange !== 0 && (
                    <div className="flex items-center text-xs text-gray-500">
                      {entry.rankChange > 0 ? (
                        <ArrowUp className="w-3 h-3 text-green-500" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-red-500" />
                      )}
                      <span>{Math.abs(entry.rankChange)}</span>
                    </div>
                  )}
                  
                  <div className="font-semibold">
                    {entry.miles.toFixed(1)} <span className="text-sm font-normal text-gray-500">miles</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
