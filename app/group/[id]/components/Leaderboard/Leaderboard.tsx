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
      
      <div className="space-y-3">
        {leaderboard.map((entry, index) => {
          const isCurrentUser = entry.user_id === currentUserId;
          const isAdmin = entry.user_id === groupOwnerId;
          
          // Get rank-specific styling to match reference image
          const getRankStyling = (rank: number) => {
            switch (rank) {
              case 1:
                return {
                  bg: 'linear-gradient(135deg, #5ee1a2, #4ade80)',
                  text: '#000000'
                };
              case 2:
                return {
                  bg: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                  text: '#000000'
                };
              case 3:
                return {
                  bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  text: '#000000'
                };
              default:
                return {
                  bg: 'linear-gradient(135deg, #64748b, #475569)',
                  text: '#000000'
                };
            }
          };
          
          const rankStyle = getRankStyling(index + 1);
          
          return (
            <div 
              key={entry.user_id}
              className="relative rounded-full px-4 py-3 transition-all duration-200 hover:scale-[1.02] mb-3"
              style={{
                background: rankStyle.bg,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                border: isCurrentUser ? '2px solid var(--brand)' : 'none',
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0 mr-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold border border-black/20" 
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.5)', 
                    color: '#000000',
                    fontSize: '14px'
                  }}
                >
                  {entry.name?.[0]?.toUpperCase() || '?'}
                </div>
                {isAdmin && (
                  <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-600" />
                )}
              </div>

              {/* Name and Stats */}
              <div className="flex-1 min-w-0 mr-3">
                <div 
                  className="font-bold truncate" 
                  style={{
                    color: '#000000',
                    fontSize: '16px',
                    lineHeight: '1.2'
                  }}
                >
                  {entry.name || 'Anonymous'}
                  {isCurrentUser && ' (You)'}
                </div>
                <div 
                  className="font-medium truncate" 
                  style={{
                    color: '#000000',
                    fontSize: '12px',
                    opacity: 0.8,
                    lineHeight: '1.2'
                  }}
                >
                  {entry.miles.toFixed(1)}km • PACE WARRIOR
                </div>
              </div>

              {/* Streak */}
              {entry.streak && entry.streak > 1 && (
                <div 
                  className="flex-shrink-0 mr-2 font-medium" 
                  style={{
                    color: '#000000',
                    fontSize: '12px',
                    opacity: 0.9
                  }}
                >
                  🔥{entry.streak}
                </div>
              )}

              {/* Rank Icon */}
              <div className="flex-shrink-0">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center" 
                  style={{backgroundColor: 'rgba(255,255,255,0.5)'}}
                >
                  {index === 0 ? (
                    <Trophy className="w-4 h-4" style={{color: '#000000'}} />
                  ) : index === 1 ? (
                    <Medal className="w-4 h-4" style={{color: '#000000'}} />
                  ) : index === 2 ? (
                    <Award className="w-4 h-4" style={{color: '#000000'}} />
                  ) : (
                    <span className="font-bold" style={{color: '#000000', fontSize: '12px'}}>#{index + 1}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
