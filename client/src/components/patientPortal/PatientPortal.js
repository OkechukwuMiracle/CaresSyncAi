import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart, Send, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const PatientPortal = () => {
  const [searchParams] = useSearchParams();
  const [reminderId, setReminderId] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = searchParams.get('reminder_id');
    if (id) {
      setReminderId(id);
      fetchReminderDetails(id);
    }
  }, [searchParams]);

  const fetchReminderDetails = async (id) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/responses/reminder/${id}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load reminder details');
      }
      const data = await res.json();
      setPatientName(data.patient?.name || 'Patient');
      setReminderMessage(data.message || '');
    } catch (error) {
      setError('Failed to load reminder details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!response.trim()) {
      setError('Please provide a response');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response_data = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/responses/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reminder_id: reminderId,
          response_text: response,
        }),
      });

      if (response_data.ok) {
        setSubmitted(true);
      } else {
        const errorData = await response_data.json();
        setError(errorData.error || 'Failed to submit response');
      }
    } catch (error) {
      setError('Failed to submit response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Thank You!
          </h2>
          <p className="text-gray-600 mb-6">
            Your response has been submitted successfully. Your healthcare provider will review it and contact you if needed.
          </p>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              If you have any urgent concerns, please contact your healthcare provider directly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            CareSync AI Follow-up {patientName ? `for ${patientName}` : ''}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please respond to your healthcare provider's follow-up
          </p>
        </div>

        {/* Response Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {reminderMessage && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Follow-up Message:</h3>
              <p className="text-sm text-blue-700">{reminderMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="response" className="label">
                Your Response
              </label>
              <textarea
                id="response"
                name="response"
                rows={6}
                required
                className="input-field resize-none"
                placeholder="Please describe how you're feeling, any symptoms you're experiencing, or any concerns you may have..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              />
              <p className="mt-2 text-sm text-gray-500">
                Be as detailed as possible. Your response will be analyzed by AI to help your healthcare provider understand your condition.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || !response.trim()}
                className="w-full btn-primary flex items-center justify-center"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Response
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Privacy Notice:</h4>
            <p className="text-xs text-gray-600">
              Your response is secure and will only be shared with your healthcare provider. 
              AI analysis helps categorize your response for better care coordination.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Powered by CareSync AI - Intelligent Healthcare Follow-up
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientPortal;
