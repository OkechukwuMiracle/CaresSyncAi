"use client"

import React, { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useSupabase } from '../../contexts/SupabaseContext';
import LoadingSpinner from '../common/LoadingSpinner';

const Insights = () => {
  const { supabase } = useSupabase();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setLoading(false);
          return;
        }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/insights/dashboard?period=7d`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to fetch insights');
        }
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [supabase]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
          <p className="text-gray-600">Analyze patient responses with AI-powered insights</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="py-12 text-center"><LoadingSpinner /></div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        ) : !data ? (
          <div className="py-12 text-center">No data</div>
        ) : (
          <div className="py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Total Responses</div>
                <div className="text-2xl font-semibold">{data.summary.totalResponses}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Fine</div>
                <div className="text-2xl font-semibold text-green-600">{data.summary.fineCount}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Mild Issues</div>
                <div className="text-2xl font-semibold text-yellow-600">{data.summary.mildIssueCount}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Urgent</div>
                <div className="text-2xl font-semibold text-red-600">{data.summary.urgentCount}</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center"><BarChart3 className="h-5 w-5 mr-2" />Recent Responses</h3>
              <div className="divide-y">
                {data.recentResponses.map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{r.patients?.name || 'Patient'}</div>
                      <div className="text-sm text-gray-600">{r.ai_summary || r.response_text}</div>
                    </div>
                    <div className="text-sm text-gray-500">{r.ai_status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Insights;
