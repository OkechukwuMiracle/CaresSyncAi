"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useSupabase } from '../../../../src/contexts/SupabaseContext';

export default function SubscriptionCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase } = useSupabase();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference = searchParams.get('reference');
        
        if (!reference) {
          setStatus('error');
          setMessage('Payment reference not found');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          setStatus('error');
          setMessage('Session expired. Please log in again.');
          return;
        }

        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        const response = await fetch(`${base}/api/subscriptions/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ reference })
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus('error');
          setMessage(data.error || 'Payment verification failed');
          return;
        }

        if (data.status === 'success') {
          setStatus('success');
          setMessage('Payment successful! Your subscription has been upgraded.');
          
          // Redirect to subscription page after 3 seconds
          setTimeout(() => {
            router.push('/subscription');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('Payment was not successful. Please try again.');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage(error.message || 'An error occurred while verifying payment');
      }
    };

    verifyPayment();
  }, [searchParams, supabase, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="h-16 w-16 text-primary-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Redirecting you back...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/subscription')}
              className="btn-primary w-full"
            >
              Back to Subscriptions
            </button>
          </>
        )}
      </div>
    </div>
  );
}