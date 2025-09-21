'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

type MileageSubmissionModalProps = {
  onSubmit: (miles: number, file: File | null) => Promise<void>;
  isLoading?: boolean;
  currentMiles?: number | null;
  isChallengeClosed?: boolean;
};

export function MileageSubmissionModal({ onSubmit, isLoading = false, currentMiles = null, isChallengeClosed = false }: MileageSubmissionModalProps) {
  const [miles, setMiles] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activityType, setActivityType] = useState<'running' | 'walking'>('running');
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const milesNumber = parseFloat(miles);
    if (isNaN(milesNumber) || milesNumber <= 0) {
      toast.error('Please enter a valid number of miles');
      return;
    }

    // Convert walking miles to running miles (2 walking miles = 1 running mile)
    const convertedMiles = activityType === 'walking' ? milesNumber / 2 : milesNumber;

    try {
      await onSubmit(convertedMiles, file);
      setMiles('');
      setFile(null);
      setOpen(false); // Close modal on successful submission
      
      if (activityType === 'walking') {
        toast.success(`${milesNumber} walking miles logged (converted to ${convertedMiles.toFixed(1)} running miles)`);
      }
    } catch (error) {
      console.error('Error submitting miles:', error);
      toast.error('Failed to submit miles. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  if (isChallengeClosed) {
    return (
      <button disabled className="btn" style={{opacity: 0.5}}>
        Challenge Closed
      </button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          className="btn success" 
          disabled={isChallengeClosed}
          id="logMiles"
        >
          + Log Miles
        </button>
      </DialogTrigger>
      <DialogContent
        className="rp"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '95vw',
          maxWidth: '480px',
          padding: '0',
          zIndex: 1000,
          backgroundColor: 'var(--card)',
          border: '1px solid var(--stroke)',
          borderRadius: '16px',
          boxShadow: '0 10px 24px rgba(0,0,0,.35)'
        }}
      >
        <div style={{ padding: '18px' }}>
          <DialogHeader>
            <DialogTitle style={{color: 'var(--text)', margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700'}}>Log Your Miles</DialogTitle>
          </DialogHeader>
        
        {currentMiles !== null && (
          <div style={{ 
            background: 'linear-gradient(180deg, rgba(94, 225, 162, 0.1), rgba(94, 225, 162, 0.05))', 
            border: '1px solid var(--success)',
            color: 'var(--text)',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '16px'
          }}>
            <p style={{fontSize: '14px'}}>
              You&apos;ve already logged <span style={{fontWeight: '600'}}>{currentMiles.toFixed(1)} miles</span> this week.
            </p>
            <p style={{fontSize: '12px', marginTop: '4px', color: 'var(--muted)'}}>
              Submit again to update your entry.
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Activity Type Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
              Activity Type
            </label>
            <div style={{
              display: 'flex',
              border: '1px solid var(--stroke)',
              borderRadius: '12px',
              padding: '4px',
              background: '#0f1427'
            }}>
              <button
                type="button"
                onClick={() => setActivityType('running')}
                className="btn"
                style={{
                  flex: 1,
                  margin: '2px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  minHeight: '36px',
                  background: activityType === 'running' ? 'var(--brand)' : 'transparent',
                  color: activityType === 'running' ? 'var(--brand-ink)' : 'var(--text)',
                  border: activityType === 'running' ? 'none' : '1px solid var(--stroke)'
                }}
                disabled={isLoading}
              >
                🏃‍♂️ Running
              </button>
              <button
                type="button"
                onClick={() => setActivityType('walking')}
                className="btn"
                style={{
                  flex: 1,
                  margin: '2px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  minHeight: '36px',
                  background: activityType === 'walking' ? '#10b981' : 'transparent',
                  color: activityType === 'walking' ? 'white' : 'var(--text)',
                  border: activityType === 'walking' ? 'none' : '1px solid var(--stroke)'
                }}
                disabled={isLoading}
              >
                🚶‍♂️ Walking
              </button>
            </div>
            {activityType === 'walking' && (
              <p style={{
                fontSize: '12px',
                marginTop: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid #10b981',
                color: 'var(--text)'
              }}>
                💡 2 walking miles = 1 running mile for challenge purposes
              </p>
            )}
          </div>

          <div>
            <label htmlFor="miles" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
              {activityType === 'running' ? 'Running Miles' : 'Walking Miles'} This Week
            </label>
            <input
              id="miles"
              type="number"
              step="0.1"
              min="0"
              placeholder={`Enter ${activityType} miles`}
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--stroke)',
                background: 'var(--card)',
                color: 'var(--text)',
                fontSize: '14px'
              }}
              required
              disabled={isLoading}
            />
            {activityType === 'walking' && miles && !isNaN(parseFloat(miles)) && (
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                = {(parseFloat(miles) / 2).toFixed(1)} running miles for the challenge
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
              Proof (Screenshot)
              <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>Optional but recommended</span>
            </label>
            
            <div
              style={{
                border: `2px dashed ${isDragging ? '#2eeaa0' : 'var(--stroke)'}`,
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                background: isDragging ? 'rgba(46, 234, 160, 0.1)' : '#0f1427',
                transition: 'all 0.2s ease'
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {file ? (
                  <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                    <p>Selected: <span style={{ fontWeight: '600' }}>{file.name}</span></p>
                    <p style={{ fontSize: '12px', marginTop: '4px', color: '#8892b0' }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: '14px', color: 'var(--text)' }}>
                      Drag &amp; drop a screenshot here, or click to select
                    </p>
                    <p style={{ fontSize: '12px', color: '#8892b0' }}>
                      Max file size: 5MB (PNG, JPG, or WebP)
                    </p>
                  </>
                )}
                
                <div style={{ paddingTop: '8px' }}>
                  <label className="btn" style={{ fontSize: '12px', cursor: 'pointer', background: 'var(--card)', border: '1px solid var(--stroke)' }}>
                    {file ? 'Change File' : 'Select File'}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleFileChange}
                      disabled={isLoading}
                    />
                  </label>
                  
                  {file && (
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        color: '#ef4444',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      disabled={isLoading}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', paddingTop: '16px' }}>
            <button
              type="button"
              className="btn"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid var(--stroke)'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={isLoading || !miles}
              style={{
                flex: 1,
                background: 'var(--brand)',
                color: 'var(--brand-ink)',
                border: 'none',
                boxShadow: '0 8px 24px rgba(46, 234, 160, 0.35)'
              }}
            >
              {isLoading ? 'Submitting...' : currentMiles !== null ? 'Update Entry' : 'Submit Miles'}
            </button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
