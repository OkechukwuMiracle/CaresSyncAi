import React, { useEffect, useState } from 'react';
import { Bell, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSupabase } from '../../contexts/SupabaseContext';
import LoadingSpinner from '../common/LoadingSpinner';

const Reminders = () => {
  const { supabase } = useSupabase();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setReminders([]);
          setLoading(false);
          return;
        }
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/reminders`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to fetch reminders');
        }
        const data = await res.json();
        setReminders(data.reminders || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReminders();
  }, [supabase]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
          <p className="text-gray-600">Schedule and manage patient follow-up reminders</p>
        </div>
        <Link to="/reminders/new" className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Reminder
        </Link>
      </div>

      <div className="card">
        {loading ? (
          <div className="py-12 text-center"><LoadingSpinner /></div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reminders yet</h3>
            <p className="text-gray-600 mb-6">Create your first follow-up reminder.</p>
            <Link to="/reminders/new" className="btn-primary">Schedule Your First Reminder</Link>
          </div>
        ) : (
          <div className="divide-y">
            {reminders.map((r) => (
              <div key={r.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{r.patients?.name || 'Patient'}</div>
                    <div className="text-sm text-gray-600">{r.message}</div>
                  </div>
                  <div className="text-sm text-gray-500">{r.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reminders;
