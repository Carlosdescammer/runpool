'use client';

import { Card } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Crown, Trophy, Medal, Award } from 'lucide-react';

type LeaderboardRow = {
  user_id: string;
  name: string | null;
  miles: number;
  overallMiles: number;
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
  groupRule?: string;
  challengePot?: number;
  challengePeriod?: string | null;
};

export function Leaderboard({ leaderboard, currentUserId, groupOwnerId, isLoading = false, groupRule, challengePot, challengePeriod }: LeaderboardProps) {
  // Extract goal from group rule (e.g., "Run at least 5 miles" -> 5)
  const extractGoalFromRule = (rule: string | undefined): number => {
    if (!rule) return 5; // default goal
    const match = rule.match(/(\d+(?:\.\d+)?)\s*(?:total\s+)?miles?/i);
    return match ? parseFloat(match[1]) : 5;
  };
  
  const weeklyGoal = extractGoalFromRule(groupRule);
  console.log('Weekly goal extracted from rule:', weeklyGoal, 'from rule:', groupRule);
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
    <div className="card">
      <div className="inner">
        <div className="leader-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap'}}>
            <div style={{fontWeight: '800'}}>Leaderboard{challengePeriod ? ` — ${challengePeriod}` : ' — Weekly'}</div>
            <span className="pill">Pot ${challengePot ? challengePot.toFixed(2) : (leaderboard.length * 10).toFixed(2)}</span>
            <span className="subtle">{leaderboard.length} participants</span>
          </div>
          <div className="row">
            <button className="iconbtn" id="sortBtn" title="Sort by miles">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 18h16M4 12h10M4 6h6" stroke="#9fb2ff" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
            <button className="iconbtn" title="Share">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 12l10-7v14L7 12z" stroke="#9fb2ff" strokeWidth="1.8" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="list" id="lb">
          {leaderboard.map((entry, index) => {
            const isCurrentUser = entry.user_id === currentUserId;
            const isAdmin = entry.user_id === groupOwnerId;
            
            // Calculate progress percentage using dynamic goal
            const progressPercent = Math.min(100, (entry.miles / weeklyGoal) * 100);
            
            console.log(`Progress for ${entry.name}: ${entry.miles} miles / ${weeklyGoal} goal = ${progressPercent.toFixed(1)}%`);
            
            // Determine status label based on dynamic goal
            let statusLabel = "⏱ On Pace";
            if (entry.miles >= weeklyGoal) {
              statusLabel = "✅ Qualified";
            } else if (entry.miles === 0) {
              statusLabel = "🏁 Get Moving";
            } else if (entry.miles >= weeklyGoal * 0.8) {
              statusLabel = "⏱ On Pace";
            } else {
              const remaining = weeklyGoal - entry.miles;
              statusLabel = `Need ${remaining.toFixed(1)} more`;
            }
            
            return (
              <div 
                key={entry.user_id}
                className="row-item" 
                data-miles={entry.miles}
              >
                <div className="ava">{entry.name?.[0]?.toUpperCase() || '?'}</div>
                <div className="who">
                  <div className="name">
                    {entry.name || 'Anonymous'}
                    {isCurrentUser && ' (You)'}
                    {isAdmin && (
                      <Crown className="ml-1 w-3 h-3 text-yellow-600" />
                    )}
                  </div>
                  <div className="meta">
                    Week: {entry.miles.toFixed(1)} · Overall: {entry.overallMiles.toFixed(1)} miles
                    {entry.streak && entry.streak > 1 && (
                      <span className="ml-2">🔥 {entry.streak}</span>
                    )}
                  </div>
                </div>
                <div className="progress" aria-label={`${entry.name} weekly progress`}>
                  <span style={{ ['--pct' as any]: `${progressPercent}%` }}></span>
                </div>
                <span className="pill">{statusLabel}</span>
              </div>
            );
          })}
          
          {leaderboard.length === 0 && (
            <div className="empty">No entries yet. Click <strong>+ Log Miles</strong> to get on the board.</div>
          )}
        </div>
      </div>
    </div>
  );
}
