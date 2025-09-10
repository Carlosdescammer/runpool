'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';

export default function TestEmailsPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ type: string; success: boolean; error?: string; email_sent_to?: string; timestamp?: string }[]>([]);

  const emailTypes = [
    { id: 'activity', type: 'activity', name: 'Activity Notification', description: 'When someone logs miles' },
    { id: 'admin-new-user', type: 'admin-new-user', name: 'New Member Alert', description: 'Admin notification for new members' },
    { id: 'admin-proof-pending', type: 'admin-proof-pending', name: 'Proof Verification', description: 'Admin notification for proof review' },
    { id: 'top3-milestone', type: 'top3-milestone', name: 'Top 3 Achievement', description: 'Top performer milestone alert' },
    { id: 'payment-success', type: 'payment-success', name: 'Payment Success', description: 'Payment confirmation email' },
    { id: 'payment-failure', type: 'payment-failure', name: 'Payment Failed', description: 'Payment failure notification' },
    { id: 'payment-reminder', type: 'payment-reminder', name: 'Payment Reminder', description: 'Reminder for unpaid participants' },
    { id: 'payout-success', type: 'payout-success', name: 'Prize Payout', description: 'Winner payout notification' },
    { id: 'stripe-setup', type: 'stripe-setup', name: 'Stripe Setup', description: 'Account connection confirmation' },
  ];

  const sendTestEmail = async (type: string) => {
    if (!email) {
      alert('Please enter an email address first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/test-email-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type }),
      });

      const result = await response.json();
      setResults(prev => [{ ...result, type, timestamp: new Date().toLocaleTimeString() }, ...prev]);
    } catch (error) {
      setResults(prev => [{ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        type,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">📧 Email Testing Dashboard</h1>
          <p className="text-gray-800">Test all email notifications to verify delivery</p>
        </div>

        <Card className="p-6 mb-8 border-2 border-gray-300 bg-white">
          <div className="flex gap-4 items-end mb-6">
            <div className="flex-1">
              <label className="block text-sm font-bold text-black mb-2">
                Test Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="w-full border-2 border-gray-400 text-black bg-white"
              />
            </div>
            <Button
              onClick={() => window.open('/api/test-emails', '_blank')}
              variant="outline"
              className="border-2 border-blue-500 text-blue-700 hover:bg-blue-50"
            >
              Preview Templates
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emailTypes.map((emailType) => (
              <Card key={emailType.id} className="p-4 border-2 border-gray-300 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-black text-lg">{emailType.name}</h3>
                    <p className="text-sm text-gray-700 font-medium">{emailType.description}</p>
                  </div>
                </div>
                <Button
                  onClick={() => sendTestEmail(emailType.id)}
                  disabled={loading || !email}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  size="sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Test Email
                    </>
                  )}
                </Button>
              </Card>
            ))}
          </div>
        </Card>

        {results.length > 0 && (
          <Card className="p-6 border-2 border-gray-300 bg-white">
            <h2 className="text-xl font-bold mb-4 text-black">Test Results</h2>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-bold text-black">
                        {emailTypes.find(t => t.id === result.type)?.name || result.type}
                      </div>
                      <div className="text-sm text-gray-800 font-medium">
                        {result.success ? `Sent to ${result.email_sent_to}` : result.error}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={result.success ? 'default' : 'destructive'} className="font-bold">
                      {result.success ? 'Sent' : 'Failed'}
                    </Badge>
                    <div className="text-xs text-gray-700 mt-1 font-medium">{result.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Alert className="mt-6 border-2 border-yellow-400 bg-yellow-50">
          <Mail className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-black font-medium">
            <strong className="text-black">Setup Required:</strong> Make sure you have <code className="bg-gray-200 px-1 py-0.5 rounded text-black font-bold">RESEND_API_KEY</code> and <code className="bg-gray-200 px-1 py-0.5 rounded text-black font-bold">RESEND_FROM</code> 
            in your <code className="bg-gray-200 px-1 py-0.5 rounded text-black font-bold">.env.local</code> file. Get your API key from{' '}
            <a href="https://resend.com" target="_blank" className="text-blue-700 hover:underline font-bold">
              resend.com
            </a>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
