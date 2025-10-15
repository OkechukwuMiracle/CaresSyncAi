import React from 'react';
import { Users, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Patients = () => {
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
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Patient Management</h3>
          <p className="text-gray-600 mb-6">
            This page will show your patient list, allow you to add new patients, and manage their follow-up schedules.
          </p>
          <Link to="/patients/new" className="btn-primary">
            Add Your First Patient
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Patients;
