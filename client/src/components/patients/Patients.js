import React, { useEffect, useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSupabase } from '../../contexts/SupabaseContext';
import LoadingSpinner from '../common/LoadingSpinner';

const Patients = () => {
  const { supabase } = useSupabase();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setPatients([]);
          setLoading(false);
          return;
        }
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/patients`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to fetch patients');
        }
        const data = await res.json();
        setPatients(data.patients || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, [supabase]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600">Manage your patient records and follow-ups</p>
        </div>
        <Link to="/patients/new" className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Patient
        </Link>
      </div>

      <div className="card">
        {loading ? (
          <div className="py-12 text-center"><LoadingSpinner /></div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients yet</h3>
            <p className="text-gray-600 mb-6">Add your first patient to get started.</p>
            <Link to="/patients/new" className="btn-primary">Add Your First Patient</Link>
          </div>
        ) : (
          <div className="divide-y">
            {patients.map((p) => (
              <div key={p.id} className="py-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{p.name}</div>
                  <div className="text-sm text-gray-600">{p.email || 'No email'} · {p.phone || 'No phone'}</div>
                </div>
                <Link to={`/patients/${p.id}`} className="btn-secondary">View</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Patients;
