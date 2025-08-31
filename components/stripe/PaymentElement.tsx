'use client';

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type PaymentFormProps = {
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
};

function CheckoutForm({ clientSecret, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'An error occurred');
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Make sure to change this to your payment completion page
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'An error occurred while processing your payment');
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{
        layout: 'tabs',
        fields: {
          billingDetails: 'auto',
        },
      }} />
      
      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={!stripe || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Pay Now'
        )}
      </Button>
    </form>
  );
}

type StripePaymentElementProps = {
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
};

export function StripePaymentElement({ clientSecret, onSuccess, onError }: StripePaymentElementProps) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#3b82f6',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
      rules: {
        '.Input': {
          backgroundColor: '#ffffff',
          color: '#374151',
          padding: '10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
        },
        '.Input::placeholder': {
          color: '#9ca3af',
        },
        '.Input:focus': {
          borderColor: '#3b82f6',
          boxShadow: '0 0 0 1px #3b82f6',
        },
        '.Tab': {
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '8px 12px',
          marginRight: '8px',
        },
        '.Tab--selected': {
          borderColor: '#3b82f6',
          backgroundColor: '#eff6ff',
        },
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm 
        clientSecret={clientSecret} 
        onSuccess={onSuccess} 
        onError={onError} 
      />
    </Elements>
  );
}
