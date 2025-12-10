'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { populateTestData } from '@/lib/populateTestData';
import { Button } from '@/components/ui/button';
import { Login } from '@/components/Login';

export default function PopulateTestDataPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const [isPopulating, setIsPopulating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePopulate = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsPopulating(true);
    setMessage(null);
    setError(null);

    try {
      await populateTestData(user.uid);
      setMessage('Successfully populated test data for 7 days!');
    } catch (err: any) {
      console.error('Error populating test data:', err);
      setError(err.message || 'Failed to populate test data');
    } finally {
      setIsPopulating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Login />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold">Populate Test Data</h1>
        <p className="text-muted-foreground">
          This will populate your database with test data for the 7 days before today.
          Each day will have 2-5 random activities with realistic timestamps.
        </p>

        {message && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md text-green-600 dark:text-green-400">
            {message}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <Button
          onClick={handlePopulate}
          disabled={isPopulating}
          className="w-full"
        >
          {isPopulating ? 'Populating...' : 'Populate Test Data'}
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          User: {user?.email}
        </p>
      </div>
    </div>
  );
}
