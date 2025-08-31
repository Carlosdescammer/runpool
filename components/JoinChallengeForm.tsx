'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { StripePaymentElement } from './stripe/PaymentElement';

interface JoinChallengeFormProps {
  weekId: string;
  entryFee: number;
  onSuccess?: () => void;
}

export function JoinChallengeForm({ weekId, entryFee, onSuccess }: JoinChallengeFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ach'>('card');
  const [paymentComplete, setPaymentComplete] = useState(false);

  const handleJoinChallenge = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekId,
          paymentMethodType: paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError(err instanceof Error ? err.message : 'Failed to join challenge');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentComplete(true);
    if (onSuccess) {
      onSuccess();
    }
    // Refresh the page to update the UI
    setTimeout(() => {
      router.refresh();
    }, 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  // Calculate fees
  const calculateFees = (amount: number, method: 'card' | 'ach') => {
    // Stripe fees
    const cardFee = Math.ceil(amount * 0.029 + 30); // 2.9% + $0.30
    const achFee = Math.ceil(amount * 0.008); // 0.8%
    const processingFee = method === 'card' ? cardFee : Math.min(achFee, 500); // Max $5 for ACH
    
    // Platform fee (example: 1%)
    const platformFee = Math.ceil(amount * 0.01);
    
    return {
      processingFee,
      platformFee,
      total: amount + processingFee + platformFee,
    };
  };

  const fees = calculateFees(entryFee, paymentMethod);

  if (paymentComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Successful!</CardTitle>
          <CardDescription>You've successfully joined this week's challenge.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>You're all set!</AlertTitle>
            <AlertDescription>
              Your payment of {formatCurrency(fees.total)} has been processed successfully.
              You can now submit your run proof once you've completed your run.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join This Week's Challenge</CardTitle>
        <CardDescription>
          Entry fee: <span className="font-semibold">{formatCurrency(entryFee)}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!clientSecret ? (
          <div className="space-y-4">
            <Tabs 
              defaultValue="card" 
              className="w-full"
              onValueChange={(value) => setPaymentMethod(value as 'card' | 'ach')}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="card">Credit/Debit Card</TabsTrigger>
                <TabsTrigger value="ach">Bank Transfer (ACH)</TabsTrigger>
              </TabsList>
              
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Payment Method</h4>
                  <p className="text-sm text-muted-foreground">
                    {paymentMethod === 'card' 
                      ? 'Pay with any major credit or debit card.'
                      : 'Pay directly from your bank account with lower fees.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Fee Breakdown</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entry Fee:</span>
                      <span>{formatCurrency(entryFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {paymentMethod === 'card' ? 'Card Processing:' : 'Bank Transfer (ACH):'}
                      </span>
                      <span>{formatCurrency(fees.processingFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform Fee:</span>
                      <span>{formatCurrency(fees.platformFee)}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total:</span>
                      <span>{formatCurrency(fees.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Tabs>
          </div>
        ) : (
          <StripePaymentElement 
            clientSecret={clientSecret} 
            onSuccess={handlePaymentSuccess}
            onError={(error) => {
              setError(error);
              setClientSecret(null);
            }}
          />
        )}
      </CardContent>

      <CardFooter className="flex justify-end">
        {!clientSecret ? (
          <Button 
            onClick={handleJoinChallenge}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${formatCurrency(fees.total)} to Join`
            )}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
