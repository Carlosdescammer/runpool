'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

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
      <Button disabled variant="outline" className="w-full">
        Challenge Closed
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
          <Plus className="w-5 h-5 mr-2" />
          Log Miles
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ color: 'var(--text)' }}>Log Your Miles</DialogTitle>
        </DialogHeader>
        
        {currentMiles !== null && (
          <div className="mb-4 p-3 rounded-md border" style={{ 
            background: 'linear-gradient(180deg, rgba(94, 225, 162, 0.1), rgba(94, 225, 162, 0.05))', 
            borderColor: 'var(--brand)',
            color: 'var(--text)'
          }}>
            <p className="text-sm">
              You&apos;ve already logged <span className="font-semibold">{currentMiles.toFixed(1)} miles</span> this week.
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Submit again to update your entry.
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Type Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
              Activity Type
            </label>
            <div className="flex rounded-lg border p-1" style={{ borderColor: 'var(--stroke)', background: 'var(--card)' }}>
              <button
                type="button"
                onClick={() => setActivityType('running')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activityType === 'running'
                    ? 'shadow-sm'
                    : 'hover:opacity-80'
                }`}
                style={{
                  background: activityType === 'running' ? 'var(--brand)' : 'transparent',
                  color: activityType === 'running' ? 'var(--brand-ink)' : 'var(--text)'
                }}
                disabled={isLoading}
              >
                🏃‍♂️ Running
              </button>
              <button
                type="button"
                onClick={() => setActivityType('walking')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activityType === 'walking'
                    ? 'shadow-sm'
                    : 'hover:opacity-80'
                }`}
                style={{
                  background: activityType === 'walking' ? '#10b981' : 'transparent',
                  color: activityType === 'walking' ? 'white' : 'var(--text)'
                }}
                disabled={isLoading}
              >
                🚶‍♂️ Walking
              </button>
            </div>
            {activityType === 'walking' && (
              <p className="text-xs mt-1 p-2 rounded border" style={{ 
                background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
                borderColor: '#10b981',
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
            <Input
              id="miles"
              type="number"
              step="0.1"
              min="0"
              placeholder={`Enter ${activityType} miles`}
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
              className="input w-full"
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
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? 'border-opacity-80' : 'hover:border-opacity-60'
              }`}
              style={{
                background: isDragging ? 'linear-gradient(180deg, rgba(94, 225, 162, 0.1), rgba(94, 225, 162, 0.05))' : 'var(--card)',
                borderColor: isDragging ? 'var(--brand)' : 'var(--stroke)'
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-2">
                {file ? (
                  <div className="text-sm" style={{ color: 'var(--text)' }}>
                    <p>Selected: <span className="font-medium">{file.name}</span></p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm" style={{ color: 'var(--text)' }}>
                      Drag &amp; drop a screenshot here, or click to select
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      Max file size: 5MB (PNG, JPG, or WebP)
                    </p>
                  </>
                )}
                
                <div className="pt-2">
                  <label className="btn btn-secondary text-xs cursor-pointer">
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
                      className="ml-2 text-xs hover:opacity-80"
                      style={{ color: '#ef4444' }}
                      disabled={isLoading}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <button 
              type="button" 
              className="btn btn-secondary flex-1"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary flex-1"
              disabled={isLoading || !miles}
            >
              {isLoading ? 'Submitting...' : currentMiles !== null ? 'Update Entry' : 'Submit Miles'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
