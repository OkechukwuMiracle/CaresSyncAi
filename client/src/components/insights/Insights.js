import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

const Insights = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
          <p className="text-gray-600">Analyze patient responses with AI-powered insights</p>
        </div>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">AI-Powered Analytics</h3>
          <p className="text-gray-600 mb-6">
            This page will show AI analysis of patient responses, trends, keyword analysis, and insights to help you provide better care.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              Fine
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              Mild Issues
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              Urgent
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
