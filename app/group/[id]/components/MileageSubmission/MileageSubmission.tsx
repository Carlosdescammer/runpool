'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

type MileageSubmissionProps = {
  onSubmit: (miles: number, file: File | null) => Promise<void>;
  isLoading?: boolean;
  currentMiles?: number | null;
  isChallengeClosed?: boolean;
};

export function MileageSubmission({ onSubmit, isLoading = false, currentMiles = null, isChallengeClosed = false }: MileageSubmissionProps) {
  const [miles, setMiles] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activityType, setActivityType] = useState<'running' | 'walking'>('running');

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
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">This week&apos;s challenge is closed</h3>
        <p className="text-gray-600">The current challenge period has ended. Check back soon for the next one!</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Log Your Miles</h3>
      
      {currentMiles !== null && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
          <p className="text-sm text-blue-800">
            You&apos;ve already logged <span className="font-semibold">{currentMiles.toFixed(1)} miles</span> this week.
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Submit again to update your entry.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Activity Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Activity Type
          </label>
          <div className="flex rounded-lg border border-gray-300 p-1 bg-gray-50">
            <button
              type="button"
              onClick={() => setActivityType('running')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activityType === 'running'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
              disabled={isLoading}
            >
              🏃‍♂️ Running
            </button>
            <button
              type="button"
              onClick={() => setActivityType('walking')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activityType === 'walking'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
              disabled={isLoading}
            >
              🚶‍♂️ Walking
            </button>
          </div>
          {activityType === 'walking' && (
            <p className="text-xs text-green-700 mt-1 bg-green-50 p-2 rounded border border-green-200">
              💡 2 walking miles = 1 running mile for challenge purposes
            </p>
          )}
        </div>

        <div>
          <label htmlFor="miles" className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full"
            required
            disabled={isLoading}
          />
          {activityType === 'walking' && miles && !isNaN(parseFloat(miles)) && (
            <p className="text-xs text-gray-600 mt-1">
              = {(parseFloat(miles) / 2).toFixed(1)} running miles for the challenge
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proof (Screenshot)
            <span className="text-xs text-gray-500 ml-1">Optional but recommended</span>
          </label>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-2">
              {file ? (
                <div className="text-sm text-gray-700">
                  <p>Selected: <span className="font-medium">{file.name}</span></p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Drag &amp; drop a screenshot here, or click to select
                  </p>
                  <p className="text-xs text-gray-500">
                    Max file size: 5MB (PNG, JPG, or WebP)
                  </p>
                </>
              )}
              
              <div className="pt-2">
                <label className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
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
                    className="ml-2 text-xs text-red-600 hover:text-red-800"
                    disabled={isLoading}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading || !miles}
        >
          {isLoading ? 'Submitting...' : currentMiles !== null ? 'Update Entry' : 'Submit Miles'}
        </Button>
      </form>
    </Card>
  );
}
