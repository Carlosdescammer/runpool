'use client';

import { Card } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Crown, Trophy, Medal, Award } from 'lucide-react';

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
                <div className="w-8 h-8 rounded-full animate-pulse" style={{backgroundColor: 'var(--stroke)'}} />
                <div className="h-4 rounded w-24 animate-pulse" style={{backgroundColor: 'var(--stroke)'}} />
              </div>
              <div className="h-4 rounded w-12 animate-pulse" style={{backgroundColor: 'var(--stroke)'}} />
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
        <p className="mt-2" style={{color: 'var(--muted)'}}>No entries yet. Be the first to log your miles!</p>
      </Card>
    );
  }

  const getRankBadge = (rank: number) => {
    const getBadgeContent = (rank: number) => {
      switch (rank) {
        case 1:
          return {
            icon: <Trophy className="w-4 h-4" />,
            style: { 
              backgroundColor: '#eab308', 
              color: '#ffffff', 
              borderColor: '#f59e0b',
              boxShadow: '0 2px 8px rgba(234, 179, 8, 0.3)'
            }
          };
        case 2:
          return {
            icon: <Medal className="w-4 h-4" />,
            style: { 
              backgroundColor: '#6b7280', 
              color: '#ffffff', 
              borderColor: '#9ca3af',
              boxShadow: '0 2px 8px rgba(107, 114, 128, 0.3)'
            }
          };
        case 3:
          return {
            icon: <Award className="w-4 h-4" />,
            style: { 
              backgroundColor: '#ea580c', 
              color: '#ffffff', 
              borderColor: '#f97316',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)'
            }
          };
        default:
          return {
            icon: <span className="text-xs font-bold">{rank}</span>,
            style: { 
              backgroundColor: 'var(--brand)', 
              color: 'var(--brand-ink)', 
              borderColor: 'var(--brand)',
              boxShadow: '0 2px 8px var(--ring)'
            }
          };
      }
    };
    
    const { icon, style } = getBadgeContent(rank);
    
    return (
      <span 
        className="inline-flex items-center justify-center w-6 h-6 rounded-full border"
        style={style}
      >
        {icon}
      </span>
    );
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Weekly Leaderboard - UPDATED</h3>
        <div className="text-sm" style={{color: 'var(--muted)'}}>{leaderboard.length} participants</div>
      </div>
      
      <div className="bg-card rounded-lg p-4">
        {leaderboard.map((entry, index) => {
          const isCurrentUser = entry.user_id === currentUserId;
          const isAdmin = entry.user_id === groupOwnerId;
          const isLastItem = index === leaderboard.length - 1;
          
          return (
            <div 
              key={entry.user_id}
              className={`grid grid-cols-[auto_1fr_auto] items-center min-h-[72px] gap-3 transition-colors ${
                !isLastItem ? 'border-b border-stroke' : ''
              } ${
                isCurrentUser ? 'bg-brand/5' : 'hover:bg-muted/10'
              }`}
            >
              {/* Zone 1: Medal + Avatar */}
              <div className="grid grid-cols-[28px_36px] items-center gap-2">
                <div className="relative flex justify-center">
                  {getRankBadge(index + 1)}
                  {isAdmin && (
                    <Crown className="absolute -top-1 -right-1 w-2.5 h-2.5 text-yellow-500" />
                  )}
                </div>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium" style={{backgroundColor: 'var(--background)', color: 'var(--muted)', border: '1px solid var(--stroke)'}}>
                  {entry.name?.[0]?.toUpperCase() || '?'}
                </div>
              </div>
              
              {/* Zone 2: Name (+You) */}
              <div className="min-w-0">
                <div className="font-medium text-base truncate m-0" style={{color: isCurrentUser ? 'var(--brand)' : 'var(--text)'}}>
                  {entry.name || 'Anonymous'}
                  {isCurrentUser && ' (You)'}
                </div>
                {entry.streak && entry.streak > 1 && (
                  <div className="flex items-center text-sm m-0" style={{color: 'var(--muted)', marginTop: '2px'}}>
                    <span className="text-amber-600">🔥</span>
                    <span className="ml-1">{entry.streak}</span>
                  </div>
                )}
              </div>
              
              {/* Zone 3: Miles Block */}
              <div className="text-right">
                <div className="font-bold text-xl m-0" style={{color: 'var(--text)', lineHeight: 1}}>
                  {entry.miles.toFixed(1)}
                </div>
                <div className="text-sm m-0" style={{color: 'var(--muted)', lineHeight: 1}}>
                  miles
                </div>
                {entry.rankChange !== undefined && entry.rankChange !== 0 && (
                  <div className="flex items-center justify-end text-xs m-0" style={{color: 'var(--muted)', marginTop: '2px'}}>
                    {entry.rankChange > 0 ? (
                      <ArrowUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-red-500" />
                    )}
                    <span className="ml-1">{Math.abs(entry.rankChange)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
