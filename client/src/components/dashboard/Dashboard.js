import React, { useState, useEffect, useCallback } from 'react';
import Link  from 'next/link';
import { 
  Users, 
  Bell, 
  AlertTriangle, 
  Plus,
  Calendar,
  MessageSquare,
  Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import { useSupabase } from '../../contexts/SupabaseContext';

const Dashboard = () => {
  const { clinic } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { supabase } = useSupabase();

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No session token available');
        setLoading(false);
        return;
      }
  
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clinics/dashboard`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );
  
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        const text = await response.text();
        console.error('Failed to fetch dashboard data:', response.status, text);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = dashboardData?.overview || {};
  const todayInsights = dashboardData?.todayInsights || {};
  const upcomingFollowUps = dashboardData?.upcomingFollowUps || [];
  const recentResponses = dashboardData?.recentResponses || [];
  const urgentCases = dashboardData?.urgentCases || [];

  const statCards = [
    {
      name: 'Total Patients',
      value: stats.totalPatients || 0,
      icon: Users,
      color: 'bg-blue-500',
      href: '/patients'
    },
    {
      name: 'Upcoming Follow-ups',
      value: stats.upcomingFollowUps || 0,
      icon: Calendar,
      color: 'bg-yellow-500',
      href: '/reminders'
    },
    {
      name: 'Pending Reminders',
      value: stats.pendingReminders || 0,
      icon: Bell,
      color: 'bg-orange-500',
      href: '/reminders'
    },
    {
      name: 'Urgent Cases',
      value: stats.urgentCases || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      href: '/insights'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex items-center justify-between">
        <div className="mb-4 md:mb-0 ">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {clinic?.name}</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/patients"
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Link>
          <Link
            href="/reminders"
            className="btn-secondary flex items-center"
          >
            <Bell className="h-4 w-4 mr-2" />
            Schedule Reminder
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="card hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Today's Insights */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Today's AI Insights</h2>
          <Link
            href="/insights"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View All
          </Link>
        </div>
        
        {todayInsights.total_responses > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{todayInsights.fine_count}</div>
              <div className="text-sm text-green-700">✅ Doing Well</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{todayInsights.mild_issue_count}</div>
              <div className="text-sm text-yellow-700">⚠️ Mild Issues</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{todayInsights.urgent_count}</div>
              <div className="text-sm text-red-700">🚨 Urgent</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No patient responses today</p>
            <p className="text-sm">Responses will appear here once patients start replying to reminders</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Follow-ups */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Follow-ups</h2>
            <Link
              href="/patients"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          
          {upcomingFollowUps.length > 0 ? (
            <div className="space-y-3">
              {upcomingFollowUps.slice(0, 5).map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    <p className="text-sm text-gray-600">
                      Follow-up: {new Date(patient.next_follow_up_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {patient.preferred_contact_method}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No upcoming follow-ups</p>
            </div>
          )}
        </div>

        {/* Recent Responses */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Responses</h2>
            <Link
              href="/insights"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          
          {recentResponses.length > 0 ? (
            <div className="space-y-3">
              {recentResponses.slice(0, 5).map((response) => (
                <div key={response.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{response.patients?.name}</p>
                    <StatusBadge status={response.ai_status} />
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {response.ai_summary || response.response_text}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(response.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent responses</p>
            </div>
          )}
        </div>
      </div>

      {/* Urgent Cases Alert */}
      {urgentCases.length > 0 && (
        <div className="card border-l-4 border-red-500 bg-red-50">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            <h2 className="text-lg font-semibold text-red-900">Urgent Cases Requiring Attention</h2>
          </div>
          
          <div className="space-y-3">
            {urgentCases.map((case_) => (
              <div key={case_.id} className="p-3 bg-white rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">{case_.patients?.name}</p>
                  <span className="text-xs text-red-600 font-medium">
                    {new Date(case_.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  {case_.ai_summary || case_.response_text}
                </p>
                <div className="flex space-x-2">
                  {case_.patients?.phone && (
                    <a
                      href={`tel:${case_.patients.phone}`}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                    >
                      Call: {case_.patients.phone}
                    </a>
                  )}
                  {case_.patients?.email && (
                    <a
                      href={`mailto:${case_.patients.email}`}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                    >
                      Email
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscription Status */}
      {clinic?.subscription_plan === 'free' && (
        <div className="card border-l-4 border-primary-500 bg-primary-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-primary-900">Upgrade Your Plan</h3>
              <p className="text-primary-700">
                You're on the free plan. Upgrade to unlock more features and increase your patient limit.
              </p>
            </div>
            <Link
              href="/subscription"
              className="btn-primary"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
