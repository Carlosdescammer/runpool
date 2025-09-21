'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface StreakData {
  current_streak: number;
  best_streak: number;
  last_activity_date: string | null;
  streak_start_date: string | null;
  days_since_last_activity: number | null;
  streak_active: boolean;
}

interface StreakCounterProps {
  compact?: boolean;
  showBest?: boolean;
  autoRecord?: boolean;
}

export function StreakCounter({ compact = false, showBest = true, autoRecord = true }: StreakCounterProps) {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    loadStreakData();
    if (autoRecord) {
      recordTodaysActivity();
    }
  }, [autoRecord]);

  const loadStreakData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_streak');
      
      if (error) {
        console.error('Error loading streak data:', error.message || error);
        return;
      }

      setStreakData(data);
    } catch (error) {
      console.error('Error loading streak:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordTodaysActivity = async () => {
    try {
      const { data, error } = await supabase.rpc('record_login_activity');
      
      if (error) {
        console.error('Error recording activity:', error.message || error);
        return;
      }

      // If this increased the streak, show celebration
      if (data?.current_streak > (streakData?.current_streak || 0)) {
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 2000);
      }

      // Refresh streak data
      loadStreakData();
    } catch (error) {
      console.error('Error recording activity:', error);
    }
  };

  const recordMileageActivity = async () => {
    try {
      const { data, error } = await supabase.rpc('record_daily_activity', {
        activity_type_param: 'mileage_log',
        metadata_param: { source: 'manual' }
      });
      
      if (error) {
        console.error('Error recording mileage activity:', error.message || error);
        return;
      }

      if (data?.current_streak > (streakData?.current_streak || 0)) {
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 2000);
      }

      loadStreakData();
    } catch (error) {
      console.error('Error recording mileage activity:', error);
    }
  };

  const getStreakMessage = () => {
    if (!streakData) return '';
    
    const { current_streak, streak_active, days_since_last_activity } = streakData;
    
    if (days_since_last_activity === 0) {
      return "You're active today! 🎯";
    }
    
    if (!streak_active && days_since_last_activity && days_since_last_activity > 1) {
      return `Come back! Last active ${days_since_last_activity} days ago`;
    }
    
    if (current_streak === 0) {
      return "Start your streak today! 🚀";
    }
    
    if (current_streak === 1) {
      return "Great start! Keep it going! 💪";
    }
    
    if (current_streak < 7) {
      return "Building momentum! 🔥";
    }
    
    if (current_streak < 30) {
      return "On fire! 🔥🔥";
    }
    
    return "Streak legend! 🏆";
  };

  const getStreakEmoji = (streak: number) => {
    if (streak === 0) return '🌱';
    if (streak < 3) return '🔥';
    if (streak < 7) return '🔥🔥';
    if (streak < 30) return '🔥🔥🔥';
    return '🏆';
  };

  if (loading) {
    return (
      <div className={`${compact ? 'inline' : 'card'}`}>
        <div className={compact ? '' : 'inner'}>
          <div className="muted">Loading streak...</div>
        </div>
      </div>
    );
  }

  if (!streakData) {
    return null;
  }

  const { current_streak, best_streak, streak_active } = streakData;

  if (compact) {
    return (
      <div className="inline" style={{ padding: '8px 12px', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }}>{getStreakEmoji(current_streak)}</span>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>
              {current_streak} day{current_streak !== 1 ? 's' : ''}
            </div>
            {showBest && best_streak > current_streak && (
              <div className="muted" style={{ fontSize: '11px' }}>
                Best: {best_streak}
              </div>
            )}
          </div>
        </div>
        {celebrating && (
          <span className="streak-celebration" style={{ fontSize: '12px', color: 'var(--success)' }}>
            +1 🎉
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="inner">
        <div className="inline" style={{ marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              Daily Streak {getStreakEmoji(current_streak)}
            </h3>
            <div className="muted" style={{ marginTop: '2px', fontSize: '12px' }}>
              {getStreakMessage()}
            </div>
          </div>
          {celebrating && (
            <div style={{ 
              fontSize: '24px', 
              animation: 'bounce 0.5s ease-in-out',
              color: 'var(--success)'
            }}>
              🎉
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '700',
              color: streak_active ? 'var(--success)' : 'var(--muted)'
            }}>
              {current_streak}
            </div>
            <div className="muted" style={{ fontSize: '12px' }}>
              Current
            </div>
          </div>
          
          {showBest && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent)' }}>
                {best_streak}
              </div>
              <div className="muted" style={{ fontSize: '12px' }}>
                Best Ever
              </div>
            </div>
          )}
        </div>

        {!streak_active && (
          <button 
            onClick={recordTodaysActivity}
            className="btn primary" 
            style={{ width: '100%', fontSize: '14px' }}
          >
            Start Today&apos;s Streak! 🚀
          </button>
        )}

        <div className="divider"></div>
        
        <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>
          {current_streak > 0 && (
            <>
              <div>Keep your streak alive by logging miles daily!</div>
              {current_streak >= 7 && (
                <div style={{ marginTop: '4px', color: 'var(--success)' }}>
                  🏆 You&apos;re in the streak zone!
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}